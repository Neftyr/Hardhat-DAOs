import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { ADDRESS_ZERO } from "../helper-hardhat-config"
import { ethers } from "hardhat"

/** @note Setting up governance process, so it is totally decentralized */

const setupContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre
    const { log } = deployments
    const { deployer } = await getNamedAccounts()
    const govToken = await ethers.getContract("GovernanceToken", deployer)
    // TimeLock works as president, waiting for given delay and giving executors execute power after that delay
    const timeLock = await ethers.getContract("TimeLock", deployer)
    // Governor sending proposals to timeLock
    const govContract = await ethers.getContract("GovernorContract", deployer)

    log("----------------------------------------------------")
    log("Setting Up Contracts For Roles...")
    // Task To Do: Figure Out How To Call Below With MULTICALL
    const proposerRole = await timeLock.PROPOSER_ROLE()
    const executorRole = await timeLock.EXECUTOR_ROLE()
    const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE()

    log("Granting Roles...")
    // Now, anything the timelock wants to do has to go through the governance process!
    const proposerTx = await timeLock.grantRole(proposerRole, govContract.address)
    await proposerTx.wait(1)
    // We are giving executor role to nobody, which means everybody can execute!
    const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZERO)
    await executorTx.wait(1)
    // Our deployer owns TimeLock contract, so he is admin as it needs to be decentralized we revoke this below. Nobody owns TimeLock now!
    const revokeTx = await timeLock.revokeRole(adminRole, deployer)
    await revokeTx.wait(1)
}

export default setupContracts
setupContracts.tags = ["all", "setup"]
