// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultaraInheritance
 * @dev Self-sovereign crypto inheritance wallet with heartbeat mechanism
 * @notice Ensures digital assets are transferred to beneficiaries if owner becomes inactive
 * @author Ravi Shankar Kumar
 */
contract VaultaraInheritance is ReentrancyGuard, Ownable {
    // ============ State Variables ============

    /// @notice Heartbeat interval in seconds (e.g., 7 days = 604800 seconds)
    uint256 public heartbeatInterval;

    /// @notice Timestamp of the last heartbeat
    uint256 public lastHeartbeat;

    /// @notice Flag to check if vault is active
    bool public isActive;

    /// @notice Struct to store beneficiary information
    struct Beneficiary {
        address beneficiaryAddress;
        uint256 sharePercentage; // Percentage * 100 (e.g., 50.5% = 5050)
        string encryptedMetadata; // Encrypted data from Lit Protocol
        bool isActive;
    }

    /// @notice Array of all beneficiaries
    Beneficiary[] public beneficiaries;

    /// @notice Mapping to check if an address is already a beneficiary
    mapping(address => bool) public isBeneficiary;

    /// @notice Total share percentage (must equal 10000 = 100%)
    uint256 public totalSharePercentage;

    /// @notice Flag to prevent multiple inheritance triggers
    bool public inheritanceTriggered;

    // ============ Events ============

    event VaultInitialized(address indexed owner, uint256 heartbeatInterval);
    event HeartbeatSent(address indexed owner, uint256 timestamp);
    event BeneficiaryAdded(
        address indexed beneficiary,
        uint256 sharePercentage
    );
    event BeneficiaryUpdated(
        address indexed beneficiary,
        uint256 newSharePercentage
    );
    event BeneficiaryRemoved(address indexed beneficiary);
    event HeartbeatIntervalUpdated(uint256 newInterval);
    event InheritanceTriggered(uint256 timestamp);
    event FundsTransferred(address indexed beneficiary, uint256 amount);
    event VaultDeactivated(address indexed owner);

    // ============ Errors ============

    error VaultNotActive();
    error VaultAlreadyActive();
    error InvalidHeartbeatInterval();
    error HeartbeatStillValid();
    error InvalidBeneficiary();
    error BeneficiaryAlreadyExists();
    error BeneficiaryNotFound();
    error InvalidSharePercentage();
    error TotalShareMustBe100Percent();
    error InheritanceAlreadyTriggered();
    error NoFundsToTransfer();
    error TransferFailed();
    error NoBeneficiaries();

    // ============ Modifiers ============

    modifier onlyWhenActive() {
        if (!isActive) revert VaultNotActive();
        _;
    }

    modifier onlyWhenInactive() {
        if (isActive) revert VaultAlreadyActive();
        _;
    }

    modifier notTriggered() {
        if (inheritanceTriggered) revert InheritanceAlreadyTriggered();
        _;
    }

    // ============ Constructor ============

    /**
     * @dev Initializes the contract, setting the deployer as owner
     */
    constructor() Ownable(msg.sender) {
        isActive = false;
        inheritanceTriggered = false;
    }

    // ============ Owner Functions ============

    /**
     * @notice Initializes the vault with heartbeat interval
     * @param _heartbeatInterval Time in seconds between required heartbeats (min: 1 day, max: 365 days)
     */
    function initializeVault(
        uint256 _heartbeatInterval
    ) external onlyOwner onlyWhenInactive {
        if (_heartbeatInterval < 1 days || _heartbeatInterval > 365 days) {
            revert InvalidHeartbeatInterval();
        }

        heartbeatInterval = _heartbeatInterval;
        lastHeartbeat = block.timestamp;
        isActive = true;

        emit VaultInitialized(msg.sender, _heartbeatInterval);
        emit HeartbeatSent(msg.sender, block.timestamp);
    }

    /**
     * @notice Sends a heartbeat to prove owner is alive
     */
    function sendHeartbeat() external onlyOwner onlyWhenActive notTriggered {
        lastHeartbeat = block.timestamp;
        emit HeartbeatSent(msg.sender, block.timestamp);
    }

    /**
     * @notice Adds a new beneficiary with encrypted metadata
     * @param _beneficiary Address of the beneficiary
     * @param _sharePercentage Share percentage * 100 (e.g., 50.5% = 5050)
     * @param _encryptedMetadata Encrypted data from Lit Protocol
     */
    function addBeneficiary(
        address _beneficiary,
        uint256 _sharePercentage,
        string calldata _encryptedMetadata
    ) external onlyOwner onlyWhenActive notTriggered {
        if (_beneficiary == address(0) || _beneficiary == owner()) {
            revert InvalidBeneficiary();
        }
        if (isBeneficiary[_beneficiary]) {
            revert BeneficiaryAlreadyExists();
        }
        if (_sharePercentage == 0 || _sharePercentage > 10000) {
            revert InvalidSharePercentage();
        }

        beneficiaries.push(
            Beneficiary({
                beneficiaryAddress: _beneficiary,
                sharePercentage: _sharePercentage,
                encryptedMetadata: _encryptedMetadata,
                isActive: true
            })
        );

        isBeneficiary[_beneficiary] = true;
        totalSharePercentage += _sharePercentage;

        if (totalSharePercentage > 10000) {
            revert TotalShareMustBe100Percent();
        }

        emit BeneficiaryAdded(_beneficiary, _sharePercentage);
    }

    /**
     * @notice Updates an existing beneficiary's share percentage
     * @param _beneficiary Address of the beneficiary
     * @param _newSharePercentage New share percentage * 100
     */
    function updateBeneficiary(
        address _beneficiary,
        uint256 _newSharePercentage
    ) external onlyOwner onlyWhenActive notTriggered {
        if (!isBeneficiary[_beneficiary]) {
            revert BeneficiaryNotFound();
        }
        if (_newSharePercentage == 0 || _newSharePercentage > 10000) {
            revert InvalidSharePercentage();
        }

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (
                beneficiaries[i].beneficiaryAddress == _beneficiary &&
                beneficiaries[i].isActive
            ) {
                uint256 oldShare = beneficiaries[i].sharePercentage;
                beneficiaries[i].sharePercentage = _newSharePercentage;

                totalSharePercentage =
                    totalSharePercentage -
                    oldShare +
                    _newSharePercentage;

                if (totalSharePercentage > 10000) {
                    revert TotalShareMustBe100Percent();
                }

                emit BeneficiaryUpdated(_beneficiary, _newSharePercentage);
                return;
            }
        }
    }

    /**
     * @notice Removes a beneficiary
     * @param _beneficiary Address of the beneficiary to remove
     */
    function removeBeneficiary(
        address _beneficiary
    ) external onlyOwner onlyWhenActive notTriggered {
        if (!isBeneficiary[_beneficiary]) {
            revert BeneficiaryNotFound();
        }

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (
                beneficiaries[i].beneficiaryAddress == _beneficiary &&
                beneficiaries[i].isActive
            ) {
                totalSharePercentage -= beneficiaries[i].sharePercentage;
                beneficiaries[i].isActive = false;
                isBeneficiary[_beneficiary] = false;

                emit BeneficiaryRemoved(_beneficiary);
                return;
            }
        }
    }

    /**
     * @notice Updates the heartbeat interval
     * @param _newInterval New interval in seconds
     */
    function updateHeartbeatInterval(
        uint256 _newInterval
    ) external onlyOwner onlyWhenActive notTriggered {
        if (_newInterval < 1 days || _newInterval > 365 days) {
            revert InvalidHeartbeatInterval();
        }

        heartbeatInterval = _newInterval;
        emit HeartbeatIntervalUpdated(_newInterval);
    }

    /**
     * @notice Deactivates the vault (owner can withdraw funds)
     */
    function deactivateVault() external onlyOwner onlyWhenActive notTriggered {
        isActive = false;
        emit VaultDeactivated(msg.sender);
    }

    /**
     * @notice Owner can withdraw funds when vault is deactivated
     */
    function withdrawFunds() external onlyOwner nonReentrant {
        if (isActive) revert VaultNotActive();

        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToTransfer();

        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    // ============ Public Functions ============

    /**
     * @notice Checks if heartbeat has expired
     * @return bool True if heartbeat has expired
     */
    function isHeartbeatExpired() public view returns (bool) {
        if (!isActive) return false;
        return (block.timestamp > lastHeartbeat + heartbeatInterval);
    }

    /**
     * @notice Triggers inheritance and transfers funds to beneficiaries
     * @dev Can be called by anyone if heartbeat has expired
     */
    function triggerInheritance()
        external
        nonReentrant
        onlyWhenActive
        notTriggered
    {
        if (!isHeartbeatExpired()) {
            revert HeartbeatStillValid();
        }

        if (beneficiaries.length == 0) {
            revert NoBeneficiaries();
        }

        if (totalSharePercentage != 10000) {
            revert TotalShareMustBe100Percent();
        }

        inheritanceTriggered = true;
        isActive = false;

        emit InheritanceTriggered(block.timestamp);

        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToTransfer();

        // Transfer funds to beneficiaries
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i].isActive) {
                uint256 amount = (balance * beneficiaries[i].sharePercentage) /
                    10000;

                if (amount > 0) {
                    (bool success, ) = payable(
                        beneficiaries[i].beneficiaryAddress
                    ).call{value: amount}("");
                    if (!success) revert TransferFailed();

                    emit FundsTransferred(
                        beneficiaries[i].beneficiaryAddress,
                        amount
                    );
                }
            }
        }
    }

    /**
     * @notice Gets all active beneficiaries
     * @return Array of active beneficiaries
     */
    function getActiveBeneficiaries()
        external
        view
        returns (Beneficiary[] memory)
    {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i].isActive) {
                activeCount++;
            }
        }

        Beneficiary[] memory activeBeneficiaries = new Beneficiary[](
            activeCount
        );
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i].isActive) {
                activeBeneficiaries[currentIndex] = beneficiaries[i];
                currentIndex++;
            }
        }

        return activeBeneficiaries;
    }

    /**
     * @notice Gets time remaining until heartbeat expires
     * @return uint256 Seconds remaining (0 if expired)
     */
    function getTimeUntilExpiry() external view returns (uint256) {
        if (!isActive || isHeartbeatExpired()) {
            return 0;
        }
        return (lastHeartbeat + heartbeatInterval) - block.timestamp;
    }

    /**
     * @notice Gets total number of beneficiaries (including inactive)
     * @return uint256 Total beneficiary count
     */
    function getBeneficiaryCount() external view returns (uint256) {
        return beneficiaries.length;
    }

    // ============ Receive Function ============

    /**
     * @notice Allows contract to receive ETH
     */
    receive() external payable {}

    /**
     * @notice Fallback function
     */
    fallback() external payable {}
}
