// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint64} from "encrypted-types/EncryptedTypes.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract CollateralRegistry is ZamaEthereumConfig {

    struct CollateralInfo {
        euint64 encryptedBalance;
        bool initialized;
    }

    mapping(address => CollateralInfo) private collaterals;
    mapping(address => bool) public approvedOperators;
    address public owner;

    // Proof hash registry (populated by relayer from StarkNet events)
    mapping(bytes32 => bool) public validProofHashes;
    mapping(address => bool) public authorizedRelayers;

    event CollateralDeposited(address indexed user);
    event CollateralWithdrawn(address indexed user);
    event OperatorApproved(address indexed operator);
    event ProofHashRegistered(bytes32 indexed proofHash, address indexed relayer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOperator() {
        require(approvedOperators[msg.sender] || msg.sender == owner, "Not operator");
        _;
    }

    constructor() ZamaEthereumConfig() {
        owner = msg.sender;
    }

    function approveOperator(address operator) external onlyOwner {
        approvedOperators[operator] = true;
        emit OperatorApproved(operator);
    }

    function authorizeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = true;
    }

    function registerProofHash(bytes32 proofHash) external {
        require(authorizedRelayers[msg.sender], "Not authorized relayer");
        require(!validProofHashes[proofHash], "Already registered");
        validProofHashes[proofHash] = true;
        emit ProofHashRegistered(proofHash, msg.sender);
    }

    function depositCollateral(
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);

        if (!collaterals[msg.sender].initialized) {
            collaterals[msg.sender].encryptedBalance = amount;
            collaterals[msg.sender].initialized = true;
        } else {
            euint64 newBalance = FHE.add(collaterals[msg.sender].encryptedBalance, amount);
            FHE.allowThis(newBalance);
            FHE.allow(newBalance, msg.sender);
            collaterals[msg.sender].encryptedBalance = newBalance;
        }

        emit CollateralDeposited(msg.sender);
    }

    function withdrawCollateral(
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        require(collaterals[msg.sender].initialized, "No collateral");
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        euint64 newBalance = FHE.sub(collaterals[msg.sender].encryptedBalance, amount);
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);
        collaterals[msg.sender].encryptedBalance = newBalance;

        emit CollateralWithdrawn(msg.sender);
    }

    function getEncryptedBalance(address user) external view returns (euint64) {
        require(collaterals[user].initialized, "No collateral");
        return collaterals[user].encryptedBalance;
    }

    function hasCollateral(address user) external view returns (bool) {
        return collaterals[user].initialized;
    }

    function deductCollateral(
        address user,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOperator {
        require(collaterals[user].initialized, "No collateral");
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        euint64 newBalance = FHE.sub(collaterals[user].encryptedBalance, amount);
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, user);
        collaterals[user].encryptedBalance = newBalance;
    }

    function transferCollateral(
        address from,
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOperator {
        require(collaterals[from].initialized, "From has no collateral");
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        euint64 fromBalance = FHE.sub(collaterals[from].encryptedBalance, amount);
        FHE.allowThis(fromBalance);
        FHE.allow(fromBalance, from);
        collaterals[from].encryptedBalance = fromBalance;

        if (!collaterals[to].initialized) {
            collaterals[to].encryptedBalance = amount;
            collaterals[to].initialized = true;
        } else {
            euint64 toBalance = FHE.add(collaterals[to].encryptedBalance, amount);
            FHE.allowThis(toBalance);
            FHE.allow(toBalance, to);
            collaterals[to].encryptedBalance = toBalance;
        }
        FHE.allow(amount, to);
    }
}