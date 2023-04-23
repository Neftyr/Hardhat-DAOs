/** @dev ONLY FOR LOCALHOST NETWORK !!! */

import { network } from "hardhat"

export async function moveTime(amount: number) {
    console.log("Moving Time...")
    await network.provider.send("evm_increaseTime", [amount])
    console.log(`Moved Forward In Time By ${amount} seconds`)
}
