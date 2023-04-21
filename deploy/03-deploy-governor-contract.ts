import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { networkConfig, developmentChains, QUORUM_PERCENTAGE, VOTING_PERIOD, VOTING_DELAY } from "../helper-hardhat-config"
import verify from "../utils/verify"

/** @note We are deploying GovernorContract, which contains governance process */

const deployGovernorContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    log("Deploying GovernorContract...")

    const govToken = await get("GovernanceToken")
    const timeLock = await get("TimeLock")

    const governorContract = await deploy("GovernorContract", {
        from: deployer,
        args: [govToken.address, timeLock.address, QUORUM_PERCENTAGE, VOTING_PERIOD, VOTING_DELAY],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })

    /** @dev Verify */
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(governorContract.address, [])
    }
}

export default deployGovernorContract
deployGovernorContract.tags = ["all", "governor"]
