import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultaraInheritanceModule = buildModule("VaultaraInheritanceModule", (m) => {
  const vaultara = m.contract("VaultaraInheritance");

  return { vaultara };
});

export default VaultaraInheritanceModule;