import { VOTING_PERIOD, VOTE_REASON, proposalsFile, developmentChains } from "../helper-hardhat-config"
import { ethers, network } from "hardhat"
import { moveBlocks } from "../utils/move-blocks"
import * as fs from "fs"

async function main() {
    const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"))
    // Get the last proposal for the network. You could also change it for your index
    const proposalId = proposals[network.config.chainId!].at(-1)
    // Vote Way = 0:Against, 1:For, 2:Abstain
    const voteWay = 1
    await vote(proposalId, voteWay, VOTE_REASON)
}

export async function vote(proposalId: string, voteWay: number, reason: string) {
    console.log("Voting...")
    const govContract = await ethers.getContract("GovernorContract")
    // Below "castVoteWithReason()" function is from "IGovernor.sol" interface: (uint256 proposalId, uint8 support, string calldata reason)
    const voteResTx = await govContract.castVoteWithReason(proposalId, voteWay, reason)
    const voteRecTx = await voteResTx.wait(1)
    console.log(`Vote Reason: ${voteRecTx.events[0].args.reason}`)
    // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    let proposalState = await govContract.state(proposalId)
    console.log(`Current Proposal State: ${proposalState}`)

    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1)
    }

    console.log("Vote Acquired!")

    // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    proposalState = await govContract.state(proposalId)
    console.log(`Current Proposal State: ${proposalState}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
