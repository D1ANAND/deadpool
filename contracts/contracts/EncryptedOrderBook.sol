// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint64} from "encrypted-types/EncryptedTypes.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedOrderBook is ZamaEthereumConfig {

    enum OrderSide { BUY, SELL }
    enum OrderStatus { OPEN, FILLED, CANCELLED }

    struct Order {
        address trader;
        euint64 encryptedPrice;
        euint64 encryptedSize;
        OrderSide side;
        OrderStatus status;
        uint256 timestamp;
    }

    uint256 public orderCount;
    mapping(uint256 => Order) private orders;
    mapping(address => uint256[]) private traderOrders;
    mapping(address => bool) public authorizedMatchers;
    address public owner;

    event OrderPlaced(uint256 indexed orderId, address indexed trader, OrderSide side);
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    event OrderFilled(uint256 indexed orderId);
    event MatcherAuthorized(address indexed matcher);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyMatcher() {
        require(authorizedMatchers[msg.sender] || msg.sender == owner, "Not matcher");
        _;
    }

    constructor() ZamaEthereumConfig() {
        owner = msg.sender;
    }

    function authorizeMatcher(address matcher) external onlyOwner {
        authorizedMatchers[matcher] = true;
        emit MatcherAuthorized(matcher);
    }

    function placeOrder(
        externalEuint64 encryptedPrice,
        externalEuint64 encryptedSize,
        OrderSide side,
        bytes calldata priceProof,
        bytes calldata sizeProof
    ) external returns (uint256 orderId) {
        euint64 price = FHE.fromExternal(encryptedPrice, priceProof);
        euint64 size = FHE.fromExternal(encryptedSize, sizeProof);
        FHE.allowThis(price);
        FHE.allow(price, msg.sender);
        FHE.allowThis(size);
        FHE.allow(size, msg.sender);
        orderId = orderCount++;
        orders[orderId] = Order({
            trader: msg.sender,
            encryptedPrice: price,
            encryptedSize: size,
            side: side,
            status: OrderStatus.OPEN,
            timestamp: block.timestamp
        });
        traderOrders[msg.sender].push(orderId);
        emit OrderPlaced(orderId, msg.sender, side);
    }

    function cancelOrder(uint256 orderId) external {
        require(orders[orderId].trader == msg.sender, "Not your order");
        require(orders[orderId].status == OrderStatus.OPEN, "Not open");
        orders[orderId].status = OrderStatus.CANCELLED;
        emit OrderCancelled(orderId, msg.sender);
    }

    function fillOrder(uint256 orderId) external onlyMatcher {
        require(orders[orderId].status == OrderStatus.OPEN, "Not open");
        orders[orderId].status = OrderStatus.FILLED;
        emit OrderFilled(orderId);
    }

    function getOrderTrader(uint256 orderId) external view returns (address) {
        return orders[orderId].trader;
    }

    function getOrderSide(uint256 orderId) external view returns (OrderSide) {
        return orders[orderId].side;
    }

    function getOrderStatus(uint256 orderId) external view returns (OrderStatus) {
        return orders[orderId].status;
    }

    function getEncryptedPrice(uint256 orderId) external view returns (euint64) {
        require(
            orders[orderId].trader == msg.sender ||
            authorizedMatchers[msg.sender] ||
            msg.sender == owner,
            "Not authorized"
        );
        return orders[orderId].encryptedPrice;
    }

    function getEncryptedSize(uint256 orderId) external view returns (euint64) {
        require(
            orders[orderId].trader == msg.sender ||
            authorizedMatchers[msg.sender] ||
            msg.sender == owner,
            "Not authorized"
        );
        return orders[orderId].encryptedSize;
    }

    function getTraderOrders(address trader) external view returns (uint256[] memory) {
        return traderOrders[trader];
    }

    function allowMatcherOnOrder(uint256 orderId, address matcher) external onlyMatcher {
        FHE.allow(orders[orderId].encryptedPrice, matcher);
        FHE.allow(orders[orderId].encryptedSize, matcher);
    }
}