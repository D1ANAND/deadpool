// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint64} from "encrypted-types/EncryptedTypes.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract SettlementVault is ZamaEthereumConfig {

    struct Position {
        euint64 encryptedSize;
        euint64 encryptedPrice;
        bool isLong;
        bool active;
    }

    struct VaultBalance {
        euint64 encryptedBalance;
        bool initialized;
    }

    mapping(address => VaultBalance) private vaultBalances;
    mapping(bytes32 => Position) private positions;
    mapping(address => bool) public authorizedSettlers;
    address public owner;

    event PositionOpened(bytes32 indexed positionId, address indexed trader);
    event PositionClosed(bytes32 indexed positionId, address indexed trader);
    event SettlerAuthorized(address indexed settler);
    event FundsDeposited(address indexed user);
    event FundsWithdrawn(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlySettler() {
        require(authorizedSettlers[msg.sender] || msg.sender == owner, "Not settler");
        _;
    }

    constructor() ZamaEthereumConfig() {
        owner = msg.sender;
    }

    function authorizeSettler(address settler) external onlyOwner {
        authorizedSettlers[settler] = true;
        emit SettlerAuthorized(settler);
    }

    function deposit(
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);

        if (!vaultBalances[msg.sender].initialized) {
            vaultBalances[msg.sender].encryptedBalance = amount;
            vaultBalances[msg.sender].initialized = true;
        } else {
            euint64 newBal = FHE.add(vaultBalances[msg.sender].encryptedBalance, amount);
            FHE.allowThis(newBal);
            FHE.allow(newBal, msg.sender);
            vaultBalances[msg.sender].encryptedBalance = newBal;
        }

        emit FundsDeposited(msg.sender);
    }

    function withdraw(
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        require(vaultBalances[msg.sender].initialized, "No balance");
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        euint64 newBal = FHE.sub(vaultBalances[msg.sender].encryptedBalance, amount);
        FHE.allowThis(newBal);
        FHE.allow(newBal, msg.sender);
        vaultBalances[msg.sender].encryptedBalance = newBal;

        emit FundsWithdrawn(msg.sender);
    }

    function openPosition(
        bytes32 positionId,
        externalEuint64 encryptedSize,
        externalEuint64 encryptedPrice,
        bool isLong,
        bytes calldata sizeProof,
        bytes calldata priceProof
    ) external {
        require(!positions[positionId].active, "Position exists");

        euint64 size = FHE.fromExternal(encryptedSize, sizeProof);
        euint64 price = FHE.fromExternal(encryptedPrice, priceProof);

        FHE.allowThis(size);
        FHE.allow(size, msg.sender);
        FHE.allowThis(price);
        FHE.allow(price, msg.sender);

        positions[positionId] = Position({
            encryptedSize: size,
            encryptedPrice: price,
            isLong: isLong,
            active: true
        });

        emit PositionOpened(positionId, msg.sender);
    }

    function closePosition(bytes32 positionId, address trader) external onlySettler {
        require(positions[positionId].active, "Position not active");
        positions[positionId].active = false;
        emit PositionClosed(positionId, trader);
    }

    function settlePosition(
        bytes32 positionId,
        address trader,
        externalEuint64 encryptedPnl,
        bytes calldata pnlProof
    ) external onlySettler {
        require(positions[positionId].active, "Not active");

        euint64 pnl = FHE.fromExternal(encryptedPnl, pnlProof);
        FHE.allowThis(pnl);
        FHE.allow(pnl, trader);

        if (!vaultBalances[trader].initialized) {
            vaultBalances[trader].encryptedBalance = pnl;
            vaultBalances[trader].initialized = true;
        } else {
            euint64 newBal = FHE.add(vaultBalances[trader].encryptedBalance, pnl);
            FHE.allowThis(newBal);
            FHE.allow(newBal, trader);
            vaultBalances[trader].encryptedBalance = newBal;
        }

        positions[positionId].active = false;
        emit PositionClosed(positionId, trader);
    }

    function getEncryptedBalance(address user) external view returns (euint64) {
        require(vaultBalances[user].initialized, "No balance");
        return vaultBalances[user].encryptedBalance;
    }

    function isPositionActive(bytes32 positionId) external view returns (bool) {
        return positions[positionId].active;
    }
}