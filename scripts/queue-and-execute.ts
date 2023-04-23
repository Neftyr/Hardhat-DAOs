import { FUNC, NEW_STORE_VALUE, PROPOSAL_DESCRIPTION, developmentChains, MIN_DELAY } from "../helper-hardhat-config"
import { ethers, network } from "hardhat"
import { moveBlocks } from "../utils/move-blocks"
import { moveTime } from "../utils/move-time"

export async function queueAndExecute() {
    const args = [NEW_STORE_VALUE]
    const box = await ethers.getContract("Box")
    const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, args)
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))

    const govContract = await ethers.getContract("GovernorContract")
    console.log("Queuing...")
    // Below queue() function is taken from "GovernorTimelockControl.sol"
    const queueResTx = await govContract.queue([box.address], [0], [encodedFunctionCall], descriptionHash)
    const queueRecTx = await queueResTx.wait(1)

    if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1)
        await moveBlocks(1)
    }

    console.log("Executing...")
    // Below will fail on a testnet because you need to wait for the MIN_DELAY!
    // Below execute() function is taken from "Governor.sol"
    const executeResTx = await govContract.execute([box.address], [0], [encodedFunctionCall], descriptionHash)
    await executeResTx.wait(1)

    console.log(`Updated Box value: ${await box.retrieve()}`)
}

queueAndExecute()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
