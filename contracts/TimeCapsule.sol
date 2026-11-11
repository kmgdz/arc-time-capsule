// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TimeCapsule
/// @notice Public onchain messages with optional time-locked native USDC on Arc Testnet.
/// @dev Native USDC uses 18 decimals. Messages are public even before unlock.
contract TimeCapsule {
    uint256 public constant MAX_MESSAGE_BYTES = 280;
    uint256 public constant MAX_LOCK_DURATION = 3650 days;
    uint256 public constant MAX_PAGE_SIZE = 50;

    struct Capsule {
        uint256 id;
        address creator;
        uint64 createdAt;
        uint64 unlockAt;
        bool withdrawn;
        uint256 amount;
        string message;
    }

    error EmptyMessage();
    error MessageTooLong();
    error UnlockTimeInPast();
    error LockTooLong();
    error CapsuleNotFound();
    error NotCreator();
    error StillLocked();
    error AlreadyWithdrawn();
    error NothingToWithdraw();
    error TransferFailed();

    event CapsuleCreated(
        uint256 indexed id,
        address indexed creator,
        uint64 unlockAt,
        uint256 amount,
        string message
    );
    event FundsWithdrawn(uint256 indexed id, address indexed creator, uint256 amount);

    Capsule[] private _capsules;

    /// @notice Stores a public message and optionally locks msg.value (18-decimal native USDC).
    /// @param message A non-empty message of at most 280 bytes.
    /// @param unlockAt Unlock timestamp, or zero for immediate unlocking.
    /// @return id The zero-based sequential capsule identifier.
    function createCapsule(string calldata message, uint64 unlockAt)
        external
        payable
        returns (uint256 id)
    {
        uint256 length = bytes(message).length;
        if (length == 0) revert EmptyMessage();
        if (length > MAX_MESSAGE_BYTES) revert MessageTooLong();

        if (unlockAt == 0) {
            unlockAt = uint64(block.timestamp);
        } else {
            if (uint256(unlockAt) <= block.timestamp) revert UnlockTimeInPast();
            if (uint256(unlockAt) > block.timestamp + MAX_LOCK_DURATION) revert LockTooLong();
        }

        id = _capsules.length;
        _capsules.push(Capsule({
            id: id,
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            unlockAt: unlockAt,
            withdrawn: false,
            amount: msg.value,
            message: message
        }));

        emit CapsuleCreated(id, msg.sender, unlockAt, msg.value, message);
    }

    /// @notice Lets the creator withdraw a funded, unlocked capsule exactly once.
    /// @dev The original amount remains recorded; withdrawn consumes the withdrawal entitlement
    ///      before the external call. A failed transfer reverts all state changes.
    function withdraw(uint256 id) external {
        Capsule storage capsule = _getCapsule(id);
        if (msg.sender != capsule.creator) revert NotCreator();
        if (block.timestamp < capsule.unlockAt) revert StillLocked();
        if (capsule.withdrawn) revert AlreadyWithdrawn();

        uint256 amount = capsule.amount;
        if (amount == 0) revert NothingToWithdraw();
        capsule.withdrawn = true;

        emit FundsWithdrawn(id, capsule.creator, amount);
        (bool success, ) = payable(capsule.creator).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Returns a capsule, including its public message and original amount in wei.
    function getCapsule(uint256 id) external view returns (Capsule memory) {
        return _getCapsule(id);
    }

    /// @notice Returns the number of capsules created.
    function getTotalCapsules() external view returns (uint256) {
        return _capsules.length;
    }

    /// @notice Reports whether a capsule's unlock timestamp has been reached.
    function isUnlocked(uint256 id) external view returns (bool) {
        return block.timestamp >= _getCapsule(id).unlockAt;
    }

    /// @notice Returns newest-first capsules, skipping offset entries and clamping limit to 50.
    function getLatest(uint256 offset, uint256 limit) external view returns (Capsule[] memory) {
        uint256 total = _capsules.length;
        if (offset >= total) return new Capsule[](0);
        if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

        uint256 remaining = total - offset;
        uint256 count = limit < remaining ? limit : remaining;
        Capsule[] memory page = new Capsule[](count);
        for (uint256 i = 0; i < count; ++i) {
            page[i] = _capsules[remaining - 1 - i];
        }
        return page;
    }

    function _getCapsule(uint256 id) private view returns (Capsule storage capsule) {
        if (id >= _capsules.length) revert CapsuleNotFound();
        capsule = _capsules[id];
    }
}
