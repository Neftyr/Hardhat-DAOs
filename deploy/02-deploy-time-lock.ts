import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { networkConfig, developmentChains, MIN_DELAY } from "../helper-hardhat-config"
import verify from "../utils/verify"

/** @note We are deploying TimeLock, which owns governance process */

const deployTimeLock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("Deploying TimeLock...")

    const timeLock = await deploy("TimeLock", {
        from: deployer,
        /**
         * Here we can set any address in admin role also zero address.
         */
        args: [MIN_DELAY, [], [], deployer],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })

    /** @dev Verify */
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(timeLock.address, [])
    }
}

export default deployTimeLock
deployTimeLock.tags = ["all", "timelock"]
