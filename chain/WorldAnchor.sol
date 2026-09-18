// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title HALVETH Realms optional checkpoint log
/// @notice Records a caller's statement. Does not establish ownership or control a game.
contract WorldAnchor {
    event WorldCheckpoint(
        address indexed submitter,
        bytes32 indexed worldKey,
        bytes32 indexed checkpointHash,
        string worldId,
        uint64 epoch
    );

    /// @notice Each statement is namespaced by the actual transaction sender.
    /// @dev No storage, value transfer, external calls, token or game administration.
    function anchor(string calldata worldId, bytes32 checkpointHash, uint64 epoch) external {
        require(bytes(worldId).length > 0 && bytes(worldId).length <= 128, "world id length");
        require(checkpointHash != bytes32(0), "empty checkpoint");
        emit WorldCheckpoint(msg.sender, keccak256(bytes(worldId)), checkpointHash, worldId, epoch);
    }
}
