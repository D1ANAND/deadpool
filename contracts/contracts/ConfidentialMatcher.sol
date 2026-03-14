// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IEncryptedOrderBook {
    enum OrderSide { BUY, SELL }
    enum OrderStatus { OPEN, FILLED, CANCELLED }
    function getOrderTrader(uint256 orderId) external view returns (address);
    function getOrderSide(uint256 orderId) external view returns (IEncryptedOrderBook.OrderSide);
    function getOrderStatus(uint256 orderId) external view returns (IEncryptedOrderBook.OrderStatus);
    function getEncryptedPrice(uint256 orderId) external view returns (euint64);
    function getEncryptedSize(uint256 orderId) external view returns (euint64);
    function fillOrder(uint256 orderId) external;
    function allowMatcherOnOrder(uint256 orderId, address matcher) external;
}

contract ConfidentialMatcher is ZamaEthereumConfig {

    struct MatchRecord {
        uint256 buyOrderId;
        uint256 sellOrderId;
        address buyer;
        address seller;
        uint256 timestamp;
        bool settled;
    }

    IEncryptedOrderBook public orderBook;
    address public settlementVault;
    address public owner;
    uint256 public matchCount;

    mapping(uint256 => MatchRecord) public matches;
    mapping(address => bool) public authorizedRelayers;

    event OrdersMatched(uint256 indexed matchId, uint256 buyOrderId, uint256 sellOrderId);
    event MatchSettled(uint256 indexed matchId);
    event RelayerAuthorized(address indexed relayer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyRelayer() {
        require(authorizedRelayers[msg.sender] || msg.sender == owner, "Not relayer");
        _;
    }

    constructor(address _orderBook, address _settlementVault) ZamaEthereumConfig() {
        owner = msg.sender;
        orderBook = IEncryptedOrderBook(_orderBook);
        settlementVault = _settlementVault;
    }

    function authorizeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = true;
        emit RelayerAuthorized(relayer);
    }

    function matchOrders(
        uint256 buyOrderId,
        uint256 sellOrderId
    ) external onlyRelayer returns (uint256 matchId) {
        require(
            orderBook.getOrderSide(buyOrderId) == IEncryptedOrderBook.OrderSide.BUY,
            "Not a buy order"
        );
        require(
            orderBook.getOrderSide(sellOrderId) == IEncryptedOrderBook.OrderSide.SELL,
            "Not a sell order"
        );
        require(
            orderBook.getOrderStatus(buyOrderId) == IEncryptedOrderBook.OrderStatus.OPEN,
            "Buy order not open"
        );
        require(
            orderBook.getOrderStatus(sellOrderId) == IEncryptedOrderBook.OrderStatus.OPEN,
            "Sell order not open"
        );
        address buyer = orderBook.getOrderTrader(buyOrderId);
        address seller = orderBook.getOrderTrader(sellOrderId);
        orderBook.allowMatcherOnOrder(buyOrderId, address(this));
        orderBook.allowMatcherOnOrder(sellOrderId, address(this));
        euint64 buyPrice = orderBook.getEncryptedPrice(buyOrderId);
        euint64 sellPrice = orderBook.getEncryptedPrice(sellOrderId);
        ebool canMatch = FHE.ge(buyPrice, sellPrice);
        FHE.allowThis(canMatch);
        matchId = matchCount++;
        matches[matchId] = MatchRecord({
            buyOrderId: buyOrderId,
            sellOrderId: sellOrderId,
            buyer: buyer,
            seller: seller,
            timestamp: block.timestamp,
            settled: false
        });
        orderBook.fillOrder(buyOrderId);
        orderBook.fillOrder(sellOrderId);
        emit OrdersMatched(matchId, buyOrderId, sellOrderId);
    }

    function getMatch(uint256 matchId) external view returns (
        uint256 buyOrderId,
        uint256 sellOrderId,
        address buyer,
        address seller,
        uint256 timestamp,
        bool settled
    ) {
        MatchRecord storage m = matches[matchId];
        return (m.buyOrderId, m.sellOrderId, m.buyer, m.seller, m.timestamp, m.settled);
    }

    function markSettled(uint256 matchId) external onlyRelayer {
        require(!matches[matchId].settled, "Already settled");
        matches[matchId].settled = true;
        emit MatchSettled(matchId);
    }
}