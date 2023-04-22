import { NEW_STORE_VALUE, FUNC, PROPOSAL_DESCRIPTION, VOTING_DELAY, developmentChains, proposalsFile } from "../helper-hardhat-config"
import { ethers, network } from "hardhat"
import { moveBlocks } from "../utils/move-blocks"
import * as fs from "fs"

export async function propose(args: any[], functionToCall: string, proposalDescription: string) {
    const govContract = await ethers.getContract("GovernorContract")
    const box = await ethers.getContract("Box")
    const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args)
    console.log(`Encoded Function Call: ${encodedFunctionCall}`)
    console.log(`Proposing ${functionToCall} on ${box.address} with ${args}`)
    console.log(`Proposal Description: \n ${proposalDescription}`)

    // We cannot have 2 or more same proposals!
    // From govContractContract: (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
    const proposeResTx = await govContract.propose([box.address], [0], [encodedFunctionCall], proposalDescription)

    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1)
    }

    const proposeRecTx = await proposeResTx.wait(1)
    const proposalId = proposeRecTx.events[0].args.proposalId
    console.log(`Proposal ID: ${proposalId}`)

    const proposalState = await govContract.state(proposalId)
    const proposalSnapShot = await govContract.proposalSnapshot(proposalId)
    const proposalDeadline = await govContract.proposalDeadline(proposalId)

    // The Proposal State is an enum data type, defined in the IgovContract contract.
    // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    console.log(`Current Proposal State: ${proposalState}`)
    // What block # the proposal was snapshot
    console.log(`Current Proposal Snapshot: ${proposalSnapShot}`)
    // The block number the proposal voting expires
    console.log(`Current Proposal Deadline: ${proposalDeadline}`)

    console.log("Saving Proposals...")
    storeProposalId(proposalId)
}

function storeProposalId(proposalId: any) {
    const chainId = network.config.chainId!.toString()
    let proposals: any

    if (fs.existsSync(proposalsFile)) {
        proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"))
    } else {
        proposals = {}
        proposals[chainId] = []
    }
    proposals[chainId].push(proposalId.toString())
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals), "utf8")
}

propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION)
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
