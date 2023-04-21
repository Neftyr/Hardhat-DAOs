import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { ethers } from "hardhat"
import verify from "../utils/verify"

/** @note We are deploying our Contract and setup it, so it can be updated only through governance process */

const deployBox: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("----------------------------------------------------")
    log("Deploying Box...")
    const box = await deploy("Box", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })

    /** @dev Verify */
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(box.address, [])
    }

    const boxContract = await ethers.getContractAt("Box", box.address)
    const timeLock = await ethers.getContract("TimeLock")
    // Transfering ownership of Box from "deployer" to "TimeLock" contract
    const transferTx = await boxContract.transferOwnership(timeLock.address)
    await transferTx.wait(1)
}

export default deployBox
deployBox.tags = ["all", "box"]
