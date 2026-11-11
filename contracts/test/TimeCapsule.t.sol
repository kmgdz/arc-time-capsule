// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TimeCapsule} from "../TimeCapsule.sol";

/// Creator contract that tries to re-enter withdraw() when paid.
contract ReentrantCreator {
    TimeCapsule public tc;
    uint256 public targetId;
    uint256 public reentries;
    bool public reentrySucceeded;
    bytes public reentryRevertData;

    constructor(TimeCapsule _tc) {
        tc = _tc;
    }

    function create(string calldata m, uint64 unlockAt) external payable returns (uint256 id) {
        id = tc.createCapsule{value: msg.value}(m, unlockAt);
        targetId = id;
    }

    function attack() external {
        tc.withdraw(targetId);
    }

    receive() external payable {
        reentries++;
        try tc.withdraw(targetId) {
            reentrySucceeded = true;
        } catch (bytes memory data) {
            reentryRevertData = data;
        }
    }
}

/// Creator contract whose receive() can be toggled to reject funds.
contract PickyCreator {
    TimeCapsule public tc;
    bool public accept;

    constructor(TimeCapsule _tc) {
        tc = _tc;
    }

    function setAccept(bool a) external {
        accept = a;
    }

    function create(string calldata m, uint64 unlockAt) external payable returns (uint256) {
        return tc.createCapsule{value: msg.value}(m, unlockAt);
    }

    function pull(uint256 id) external {
        tc.withdraw(id);
    }

    receive() external payable {
        require(accept, "rejected");
    }
}

/// Handler for the conservation invariant.
contract TimeCapsuleHandler is Test {
    TimeCapsule public tc;
    uint256 public ghostLocked; // sum of amounts created and not yet withdrawn
    uint256 public created;

    constructor(TimeCapsule _tc) {
        tc = _tc;
        vm.deal(address(this), 1e30);
    }

    receive() external payable {}

    function create(uint256 amount, uint256 delay) external {
        amount = bound(amount, 0, 1e24);
        delay = bound(delay, 0, 3650 days);
        uint64 unlockAt = delay == 0 ? 0 : uint64(block.timestamp + delay);
        tc.createCapsule{value: amount}("hi", unlockAt);
        ghostLocked += amount;
        created++;
    }

    function withdraw(uint256 id) external {
        if (created == 0) return;
        id = bound(id, 0, created - 1);
        TimeCapsule.Capsule memory c = tc.getCapsule(id);
        if (c.withdrawn || c.amount == 0 || block.timestamp < c.unlockAt) return;
        tc.withdraw(id);
        ghostLocked -= c.amount;
    }

    function warp(uint256 secs) external {
        secs = bound(secs, 0, 400 days);
        vm.warp(block.timestamp + secs);
    }
}

contract TimeCapsuleTest is Test {
    TimeCapsule internal tc;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    event CapsuleCreated(uint256 indexed id, address indexed creator, uint64 unlockAt, uint256 amount, string message);
    event FundsWithdrawn(uint256 indexed id, address indexed creator, uint256 amount);

    function setUp() public {
        vm.warp(1_700_000_000);
        tc = new TimeCapsule();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // ---------- helpers ----------
    function _str(uint256 n) internal pure returns (string memory) {
        bytes memory b = new bytes(n);
        for (uint256 i; i < n; ++i) b[i] = "a";
        return string(b);
    }

    function _utf8(uint256 chars) internal pure returns (string memory) {
        bytes memory b = new bytes(chars * 2);
        for (uint256 i; i < chars; ++i) {
            b[2 * i] = 0xC3;
            b[2 * i + 1] = 0xA9; // "é"
        }
        return string(b);
    }

    function _create(address who, uint256 value, uint64 unlockAt) internal returns (uint256 id) {
        vm.prank(who);
        id = tc.createCapsule{value: value}("hello", unlockAt);
    }

    // ---------- createCapsule: message validation ----------
    function test_EmptyMessageReverts() public {
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.EmptyMessage.selector);
        tc.createCapsule("", 0);
    }

    function test_MessageTooLong281Reverts() public {
        string memory m = _str(281);
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.MessageTooLong.selector);
        tc.createCapsule(m, 0);
    }

    function test_Message280BytesOk() public {
        string memory m = _str(280);
        vm.prank(alice);
        uint256 id = tc.createCapsule(m, 0);
        assertEq(tc.getCapsule(id).message, m);
    }

    function test_MultiByteUtf8OverByteLimitReverts() public {
        string memory m = _utf8(141); // 141 chars, 282 bytes
        assertEq(bytes(m).length, 282);
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.MessageTooLong.selector);
        tc.createCapsule(m, 0);
    }

    function test_MultiByteUtf8ExactlyAtLimitOk() public {
        string memory m = _utf8(140); // 280 bytes
        vm.prank(alice);
        uint256 id = tc.createCapsule(m, 0);
        assertEq(tc.getCapsule(id).message, m);
    }

    // ---------- createCapsule: unlock time ----------
    function test_UnlockInPastReverts() public {
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.UnlockTimeInPast.selector);
        tc.createCapsule("x", uint64(block.timestamp - 1));
    }

    function test_UnlockEqualsNowReverts() public {
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.UnlockTimeInPast.selector);
        tc.createCapsule("x", uint64(block.timestamp));
    }

    function test_LockBeyondMaxReverts() public {
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.LockTooLong.selector);
        tc.createCapsule("x", uint64(block.timestamp + 3650 days + 1));
    }

    function test_LockExactlyMaxOk() public {
        uint64 u = uint64(block.timestamp + 3650 days);
        uint256 id = _create(alice, 0, u);
        assertEq(tc.getCapsule(id).unlockAt, u);
    }

    // ---------- createCapsule: happy path & events ----------
    function test_CreateStoresCapsuleAndHoldsFunds() public {
        uint64 u = uint64(block.timestamp + 1 days);
        uint256 id = _create(alice, 3 ether, u);
        assertEq(id, 0);
        TimeCapsule.Capsule memory c = tc.getCapsule(id);
        assertEq(c.id, 0);
        assertEq(c.creator, alice);
        assertEq(c.createdAt, uint64(block.timestamp));
        assertEq(c.unlockAt, u);
        assertFalse(c.withdrawn);
        assertEq(c.amount, 3 ether);
        assertEq(c.message, "hello");
        assertEq(address(tc).balance, 3 ether);
        assertEq(tc.getTotalCapsules(), 1);
        assertEq(_create(bob, 0, 0), 1); // sequential ids
    }

    function test_EmitsCapsuleCreated() public {
        uint64 u = uint64(block.timestamp + 1 days);
        vm.expectEmit(true, true, false, true, address(tc));
        emit CapsuleCreated(0, alice, u, 2 ether, "hello");
        _create(alice, 2 ether, u);
    }

    function test_EmitsCapsuleCreatedWithResolvedUnlockWhenZero() public {
        vm.expectEmit(true, true, false, true, address(tc));
        emit CapsuleCreated(0, alice, uint64(block.timestamp), 0, "hello");
        _create(alice, 0, 0);
    }

    function test_ConstantsExposed() public view {
        assertEq(tc.MAX_MESSAGE_BYTES(), 280);
        assertEq(tc.MAX_LOCK_DURATION(), 3650 days);
        assertEq(tc.MAX_PAGE_SIZE(), 50);
    }

    // ---------- withdraw ----------
    function test_WithdrawBeforeUnlockReverts() public {
        uint256 id = _create(alice, 1 ether, uint64(block.timestamp + 1 days));
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.StillLocked.selector);
        tc.withdraw(id);
    }

    function test_WithdrawAtExactUnlockTimeOk() public {
        uint64 u = uint64(block.timestamp + 1 days);
        uint256 id = _create(alice, 1 ether, u);
        vm.warp(u);
        vm.prank(alice);
        tc.withdraw(id);
        assertTrue(tc.getCapsule(id).withdrawn);
    }

    function test_WithdrawByNonCreatorReverts() public {
        uint256 id = _create(alice, 1 ether, 0);
        vm.prank(bob);
        vm.expectRevert(TimeCapsule.NotCreator.selector);
        tc.withdraw(id);
    }

    function test_NonCreatorCheckedBeforeLock() public {
        uint256 id = _create(alice, 1 ether, uint64(block.timestamp + 1 days));
        vm.prank(bob);
        vm.expectRevert(TimeCapsule.NotCreator.selector);
        tc.withdraw(id);
    }

    function test_DoubleWithdrawReverts() public {
        uint256 id = _create(alice, 1 ether, 0);
        vm.prank(alice);
        tc.withdraw(id);
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.AlreadyWithdrawn.selector);
        tc.withdraw(id);
    }

    function test_ZeroValueCapsuleWithdrawReverts() public {
        uint256 id = _create(alice, 0, 0);
        assertEq(tc.getCapsule(id).amount, 0);
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.NothingToWithdraw.selector);
        tc.withdraw(id);
    }

    function test_WithdrawPaysExactAmountAndBalanceDrops() public {
        uint256 id = _create(alice, 4 ether, uint64(block.timestamp + 1 days));
        _create(bob, 1 ether, 0);
        vm.warp(block.timestamp + 1 days);
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        tc.withdraw(id);
        assertEq(alice.balance, aliceBefore + 4 ether);
        assertEq(address(tc).balance, 1 ether);
        // original amount stays recorded, withdrawn flag set
        assertEq(tc.getCapsule(id).amount, 4 ether);
        assertTrue(tc.getCapsule(id).withdrawn);
    }

    function test_EmitsFundsWithdrawn() public {
        uint256 id = _create(alice, 5 ether, 0);
        vm.expectEmit(true, true, false, true, address(tc));
        emit FundsWithdrawn(id, alice, 5 ether);
        vm.prank(alice);
        tc.withdraw(id);
    }

    function test_WithdrawUnknownIdReverts() public {
        vm.prank(alice);
        vm.expectRevert(TimeCapsule.CapsuleNotFound.selector);
        tc.withdraw(0);
    }

    // ---------- unlockAt == 0 ----------
    function test_ZeroUnlockMeansImmediatelyUnlockedAndWithdrawable() public {
        uint256 id = _create(alice, 1 ether, 0);
        assertEq(tc.getCapsule(id).unlockAt, uint64(block.timestamp));
        assertTrue(tc.isUnlocked(id));
        uint256 before = alice.balance;
        vm.prank(alice);
        tc.withdraw(id);
        assertEq(alice.balance, before + 1 ether);
    }

    function test_IsUnlockedTransitionsWithTime() public {
        uint64 u = uint64(block.timestamp + 1 days);
        uint256 id = _create(alice, 0, u);
        assertFalse(tc.isUnlocked(id));
        vm.warp(u - 1);
        assertFalse(tc.isUnlocked(id));
        vm.warp(u);
        assertTrue(tc.isUnlocked(id));
    }

    // ---------- not found ----------
    function test_GetCapsuleUnknownIdReverts() public {
        vm.expectRevert(TimeCapsule.CapsuleNotFound.selector);
        tc.getCapsule(0);
        _create(alice, 0, 0);
        vm.expectRevert(TimeCapsule.CapsuleNotFound.selector);
        tc.getCapsule(1);
    }

    function test_IsUnlockedUnknownIdReverts() public {
        vm.expectRevert(TimeCapsule.CapsuleNotFound.selector);
        tc.isUnlocked(0);
        vm.expectRevert(TimeCapsule.CapsuleNotFound.selector);
        tc.isUnlocked(type(uint256).max);
    }

    // ---------- pagination ----------
    function _seed(uint256 n) internal {
        for (uint256 i; i < n; ++i) _create(alice, 0, 0);
    }

    function test_GetLatestEmptyWhenNoCapsules() public view {
        assertEq(tc.getLatest(0, 10).length, 0);
    }

    function test_GetLatestNewestFirst() public {
        _seed(5);
        TimeCapsule.Capsule[] memory p = tc.getLatest(0, 5);
        assertEq(p.length, 5);
        for (uint256 i; i < 5; ++i) assertEq(p[i].id, 4 - i);
    }

    function test_GetLatestOffsetAndLimit() public {
        _seed(10);
        TimeCapsule.Capsule[] memory p = tc.getLatest(2, 3);
        assertEq(p.length, 3);
        assertEq(p[0].id, 7);
        assertEq(p[1].id, 6);
        assertEq(p[2].id, 5);
    }

    function test_GetLatestOffsetAtOrBeyondTotalReturnsEmpty() public {
        _seed(3);
        assertEq(tc.getLatest(3, 10).length, 0);
        assertEq(tc.getLatest(4, 10).length, 0);
        assertEq(tc.getLatest(type(uint256).max, 10).length, 0);
    }

    function test_GetLatestLimitClampedTo50() public {
        _seed(60);
        TimeCapsule.Capsule[] memory p = tc.getLatest(0, 1000);
        assertEq(p.length, 50);
        assertEq(p[0].id, 59);
        assertEq(p[49].id, 10);
        assertEq(tc.getLatest(0, type(uint256).max).length, 50);
    }

    function test_GetLatestLastPartialPage() public {
        _seed(7);
        TimeCapsule.Capsule[] memory p = tc.getLatest(5, 10);
        assertEq(p.length, 2);
        assertEq(p[0].id, 1);
        assertEq(p[1].id, 0);
    }

    function test_GetLatestZeroLimitReturnsEmpty() public {
        _seed(3);
        assertEq(tc.getLatest(0, 0).length, 0);
    }

    // ---------- reentrancy / failing transfer ----------
    function test_ReentrantCreatorCannotWithdrawTwice() public {
        ReentrantCreator atk = new ReentrantCreator(tc);
        vm.deal(address(atk), 0);
        atk.create{value: 2 ether}("hi", 0);
        // another depositor's funds sit in the contract and must stay safe
        _create(bob, 5 ether, 0);

        atk.attack();

        assertEq(atk.reentries(), 1);
        assertFalse(atk.reentrySucceeded());
        assertEq(bytes4(atk.reentryRevertData()), TimeCapsule.AlreadyWithdrawn.selector);
        assertEq(address(atk).balance, 2 ether);
        assertEq(address(tc).balance, 5 ether);
        assertTrue(tc.getCapsule(0).withdrawn);
    }

    function test_RejectingCreatorCausesTransferFailedAndRemainsWithdrawable() public {
        PickyCreator pc = new PickyCreator(tc);
        uint256 id = pc.create{value: 1 ether}("hi", 0);

        vm.expectRevert(TimeCapsule.TransferFailed.selector);
        pc.pull(id);

        // state fully rolled back
        assertFalse(tc.getCapsule(id).withdrawn);
        assertEq(address(tc).balance, 1 ether);

        pc.setAccept(true);
        pc.pull(id);
        assertTrue(tc.getCapsule(id).withdrawn);
        assertEq(address(pc).balance, 1 ether);
        assertEq(address(tc).balance, 0);
    }

    // ---------- no receive / fallback ----------
    function test_PlainSendReverts() public {
        vm.prank(alice);
        (bool ok,) = address(tc).call{value: 1 ether}("");
        assertFalse(ok);
        assertEq(address(tc).balance, 0);
    }

    function test_UnknownCalldataWithValueReverts() public {
        vm.prank(alice);
        (bool ok,) = address(tc).call{value: 1 ether}(hex"deadbeef");
        assertFalse(ok);
        vm.prank(alice);
        (ok,) = address(tc).call(hex"deadbeef");
        assertFalse(ok);
        assertEq(address(tc).balance, 0);
    }

    // ---------- fuzz ----------
    function testFuzz_CreateThenWithdrawRoundTrip(uint256 amount, uint256 delay) public {
        amount = bound(amount, 1, 50 ether);
        delay = bound(delay, 1, 3650 days);
        uint64 u = uint64(block.timestamp + delay);
        uint256 id = _create(alice, amount, u);
        uint256 before = alice.balance;

        vm.prank(alice);
        vm.expectRevert(TimeCapsule.StillLocked.selector);
        tc.withdraw(id);

        vm.warp(u);
        vm.prank(alice);
        tc.withdraw(id);
        assertEq(alice.balance, before + amount);
        assertEq(address(tc).balance, 0);
    }

    function testFuzz_UnlockWindowValidation(uint64 unlockAt) public {
        vm.prank(alice);
        if (unlockAt == 0) {
            tc.createCapsule("x", unlockAt);
        } else if (unlockAt <= block.timestamp) {
            vm.expectRevert(TimeCapsule.UnlockTimeInPast.selector);
            tc.createCapsule("x", unlockAt);
        } else if (uint256(unlockAt) > block.timestamp + 3650 days) {
            vm.expectRevert(TimeCapsule.LockTooLong.selector);
            tc.createCapsule("x", unlockAt);
        } else {
            tc.createCapsule("x", unlockAt);
        }
    }
}

contract TimeCapsuleInvariantTest is Test {
    TimeCapsule internal tc;
    TimeCapsuleHandler internal handler;

    function setUp() public {
        vm.warp(1_700_000_000);
        tc = new TimeCapsule();
        handler = new TimeCapsuleHandler(tc);
        targetContract(address(handler));
    }

    /// Contract balance always equals the sum of funded, not-yet-withdrawn capsules.
    function invariant_BalanceEqualsUnwithdrawnAmounts() public view {
        assertEq(address(tc).balance, handler.ghostLocked());
    }

    function invariant_TotalMatchesCreated() public view {
        assertEq(tc.getTotalCapsules(), handler.created());
    }
}
