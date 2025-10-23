// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/src/Test.sol";
import "../contracts/VaultaraInheritance.sol";

contract VaultaraInheritanceTest is Test {
    VaultaraInheritance public vaultara;
    address public owner;
    address public beneficiary1;
    address public beneficiary2;
    address public beneficiary3;
    address public anyone;

    uint256 constant SEVEN_DAYS = 7 days;
    uint256 constant ONE_DAY = 1 days;

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
    event VaultDeactivated(address indexed owner);

    function setUp() public {
        owner = address(this);
        beneficiary1 = makeAddr("beneficiary1");
        beneficiary2 = makeAddr("beneficiary2");
        beneficiary3 = makeAddr("beneficiary3");
        anyone = makeAddr("anyone");

        vaultara = new VaultaraInheritance();
    }

    // ============ Deployment Tests ============

    function test_CorrectOwner() public view {
        assertEq(vaultara.owner(), owner);
    }

    function test_InitiallyInactive() public view {
        assertFalse(vaultara.isActive());
    }

    function test_InitiallyNotTriggered() public view {
        assertFalse(vaultara.inheritanceTriggered());
    }

    // ============ Vault Initialization Tests ============

    function test_InitializeVault() public {
        vm.expectEmit(true, false, false, true);
        emit VaultInitialized(owner, SEVEN_DAYS);

        vaultara.initializeVault(SEVEN_DAYS);

        assertTrue(vaultara.isActive());
        assertEq(vaultara.heartbeatInterval(), SEVEN_DAYS);
    }

    function test_RevertInitializeVaultTooShort() public {
        uint256 tooShort = ONE_DAY - 1;
        vm.expectRevert(VaultaraInheritance.InvalidHeartbeatInterval.selector);
        vaultara.initializeVault(tooShort);
    }

    function test_RevertInitializeVaultTooLong() public {
        uint256 tooLong = 365 days + 1;
        vm.expectRevert(VaultaraInheritance.InvalidHeartbeatInterval.selector);
        vaultara.initializeVault(tooLong);
    }

    function test_RevertInitializeVaultAlreadyActive() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.VaultAlreadyActive.selector);
        vaultara.initializeVault(SEVEN_DAYS);
    }

    function test_RevertInitializeVaultNonOwner() public {
        vm.prank(anyone);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                anyone
            )
        );
        vaultara.initializeVault(SEVEN_DAYS);
    }

    // ============ Heartbeat Mechanism Tests ============

    function test_SendHeartbeat() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.warp(block.timestamp + ONE_DAY);

        vm.expectEmit(true, false, false, false);
        emit HeartbeatSent(owner, block.timestamp);

        vaultara.sendHeartbeat();

        assertFalse(vaultara.isHeartbeatExpired());
    }

    function test_UpdateLastHeartbeatTimestamp() public {
        vaultara.initializeVault(SEVEN_DAYS);
        uint256 initialHeartbeat = vaultara.lastHeartbeat();

        vm.warp(block.timestamp + ONE_DAY);
        vaultara.sendHeartbeat();

        uint256 newHeartbeat = vaultara.lastHeartbeat();
        assertGt(newHeartbeat, initialHeartbeat);
    }

    function test_RevertHeartbeatNonOwner() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.prank(anyone);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                anyone
            )
        );
        vaultara.sendHeartbeat();
    }

    function test_HeartbeatExpired() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.warp(block.timestamp + SEVEN_DAYS + 1);

        assertTrue(vaultara.isHeartbeatExpired());
    }

    function test_HeartbeatNotExpiredBeforeInterval() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.warp(block.timestamp + SEVEN_DAYS - 100);

        assertFalse(vaultara.isHeartbeatExpired());
    }

    // ============ Beneficiary Management Tests ============

    function test_AddBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);
        string memory encryptedData = "encrypted_data_from_lit_protocol";

        vm.expectEmit(true, false, false, true);
        emit BeneficiaryAdded(beneficiary1, 5000);

        vaultara.addBeneficiary(beneficiary1, 5000, encryptedData);

        assertTrue(vaultara.isBeneficiary(beneficiary1));
        assertEq(vaultara.totalSharePercentage(), 5000);
    }

    function test_AddMultipleBeneficiaries() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vaultara.addBeneficiary(beneficiary1, 5000, "data1");
        vaultara.addBeneficiary(beneficiary2, 3000, "data2");
        vaultara.addBeneficiary(beneficiary3, 2000, "data3");

        assertEq(vaultara.totalSharePercentage(), 10000);
        assertEq(vaultara.getBeneficiaryCount(), 3);
    }

    function test_RevertAddZeroAddressBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.InvalidBeneficiary.selector);
        vaultara.addBeneficiary(address(0), 5000, "data");
    }

    function test_RevertAddOwnerAsBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.InvalidBeneficiary.selector);
        vaultara.addBeneficiary(owner, 5000, "data");
    }

    function test_RevertAddDuplicateBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data");

        vm.expectRevert(VaultaraInheritance.BeneficiaryAlreadyExists.selector);
        vaultara.addBeneficiary(beneficiary1, 3000, "data2");
    }

    function test_RevertAddBeneficiaryZeroShare() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.InvalidSharePercentage.selector);
        vaultara.addBeneficiary(beneficiary1, 0, "data");
    }

    function test_RevertAddBeneficiaryShareOver10000() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.InvalidSharePercentage.selector);
        vaultara.addBeneficiary(beneficiary1, 10001, "data");
    }

    function test_RevertAddBeneficiaryTotalShareOver100() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 6000, "data1");

        vm.expectRevert(
            VaultaraInheritance.TotalShareMustBe100Percent.selector
        );
        vaultara.addBeneficiary(beneficiary2, 5000, "data2");
    }

    function test_UpdateBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data");

        vm.expectEmit(true, false, false, true);
        emit BeneficiaryUpdated(beneficiary1, 6000);

        vaultara.updateBeneficiary(beneficiary1, 6000);

        assertEq(vaultara.totalSharePercentage(), 6000);
    }

    function test_RevertUpdateNonExistentBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.BeneficiaryNotFound.selector);
        vaultara.updateBeneficiary(beneficiary1, 5000);
    }

    function test_RemoveBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data");

        vm.expectEmit(true, false, false, false);
        emit BeneficiaryRemoved(beneficiary1);

        vaultara.removeBeneficiary(beneficiary1);

        assertFalse(vaultara.isBeneficiary(beneficiary1));
        assertEq(vaultara.totalSharePercentage(), 0);
    }

    function test_RevertRemoveNonExistentBeneficiary() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.BeneficiaryNotFound.selector);
        vaultara.removeBeneficiary(beneficiary1);
    }

    // ============ Heartbeat Interval Update Tests ============

    function test_UpdateHeartbeatInterval() public {
        vaultara.initializeVault(SEVEN_DAYS);
        uint256 newInterval = 14 days;

        vm.expectEmit(false, false, false, true);
        emit HeartbeatIntervalUpdated(newInterval);

        vaultara.updateHeartbeatInterval(newInterval);

        assertEq(vaultara.heartbeatInterval(), newInterval);
    }

    function test_RevertUpdateInvalidInterval() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.InvalidHeartbeatInterval.selector);
        vaultara.updateHeartbeatInterval(ONE_DAY - 1);
    }

    // ============ Inheritance Trigger Tests ============

    function test_TriggerInheritance() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data1");
        vaultara.addBeneficiary(beneficiary2, 3000, "data2");
        vaultara.addBeneficiary(beneficiary3, 2000, "data3");

        vm.deal(address(vaultara), 10 ether);
        vm.warp(block.timestamp + SEVEN_DAYS + 1);

        vm.expectEmit(false, false, false, false);
        emit InheritanceTriggered(block.timestamp);

        vm.prank(anyone);
        vaultara.triggerInheritance();

        assertTrue(vaultara.inheritanceTriggered());
        assertFalse(vaultara.isActive());
    }

    function test_DistributeFundsCorrectly() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data1");
        vaultara.addBeneficiary(beneficiary2, 3000, "data2");
        vaultara.addBeneficiary(beneficiary3, 2000, "data3");

        vm.deal(address(vaultara), 10 ether);

        uint256 initialBalance1 = beneficiary1.balance;
        uint256 initialBalance2 = beneficiary2.balance;
        uint256 initialBalance3 = beneficiary3.balance;

        vm.warp(block.timestamp + SEVEN_DAYS + 1);
        vm.prank(anyone);
        vaultara.triggerInheritance();

        assertEq(beneficiary1.balance - initialBalance1, 5 ether);
        assertEq(beneficiary2.balance - initialBalance2, 3 ether);
        assertEq(beneficiary3.balance - initialBalance3, 2 ether);
    }

    function test_RevertTriggerHeartbeatStillValid() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 10000, "data");

        vm.expectRevert(VaultaraInheritance.HeartbeatStillValid.selector);
        vaultara.triggerInheritance();
    }

    function test_RevertTriggerNoBeneficiaries() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.warp(block.timestamp + SEVEN_DAYS + 1);

        vm.expectRevert(VaultaraInheritance.NoBeneficiaries.selector);
        vaultara.triggerInheritance();
    }

    function test_RevertTriggerSharesNotEqual100() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data");

        vm.warp(block.timestamp + SEVEN_DAYS + 1);

        vm.expectRevert(
            VaultaraInheritance.TotalShareMustBe100Percent.selector
        );
        vaultara.triggerInheritance();
    }

    function test_RevertSecondInheritanceTrigger() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 10000, "data");

        vm.deal(address(vaultara), 10 ether);
        vm.warp(block.timestamp + SEVEN_DAYS + 1);
        vaultara.triggerInheritance();

        vm.expectRevert(VaultaraInheritance.VaultNotActive.selector);
        vaultara.triggerInheritance();
    }

    // ============ Vault Deactivation Tests ============

    function test_DeactivateVault() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.deal(address(vaultara), 5 ether);

        vm.expectEmit(true, false, false, false);
        emit VaultDeactivated(owner);

        vaultara.deactivateVault();

        assertFalse(vaultara.isActive());
    }

    function test_WithdrawAfterDeactivation() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.deal(address(vaultara), 5 ether);

        uint256 initialBalance = owner.balance;
        vaultara.deactivateVault();
        vaultara.withdrawFunds();
        uint256 finalBalance = owner.balance;

        assertEq(finalBalance - initialBalance, 5 ether);
    }

    function test_RevertWithdrawWhenActive() public {
        vaultara.initializeVault(SEVEN_DAYS);

        vm.expectRevert(VaultaraInheritance.VaultNotActive.selector);
        vaultara.withdrawFunds();
    }

    // ============ View Functions Tests ============

    function test_GetActiveBeneficiaries() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data1");
        vaultara.addBeneficiary(beneficiary2, 5000, "data2");

        VaultaraInheritance.Beneficiary[] memory activeBeneficiaries = vaultara
            .getActiveBeneficiaries();

        assertEq(activeBeneficiaries.length, 2);
        assertEq(activeBeneficiaries[0].beneficiaryAddress, beneficiary1);
        assertEq(activeBeneficiaries[1].beneficiaryAddress, beneficiary2);
    }

    function test_GetTimeUntilExpiry() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.warp(block.timestamp + ONE_DAY);

        uint256 timeRemaining = vaultara.getTimeUntilExpiry();
        assertApproxEqAbs(timeRemaining, SEVEN_DAYS - ONE_DAY, 5);
    }

    function test_GetTimeUntilExpiryWhenExpired() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vm.warp(block.timestamp + SEVEN_DAYS + 1);

        assertEq(vaultara.getTimeUntilExpiry(), 0);
    }

    function test_GetBeneficiaryCount() public {
        vaultara.initializeVault(SEVEN_DAYS);
        vaultara.addBeneficiary(beneficiary1, 5000, "data1");
        vaultara.addBeneficiary(beneficiary2, 5000, "data2");

        assertEq(vaultara.getBeneficiaryCount(), 2);
    }

    // ============ Receive ETH Tests ============

    function test_ReceiveETH() public {
        vaultara.initializeVault(SEVEN_DAYS);

        (bool success, ) = address(vaultara).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(address(vaultara).balance, 1 ether);
    }

    receive() external payable {}
}
