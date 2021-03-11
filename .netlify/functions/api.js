// This API receives the target path and file content, then connect to
// github and update it there.
const { Octokit } = require("@octokit/rest");

// Commit info
const REPO_NAME = "IllusionGame"
const REPO_OWNER = "RealityBending" // update this to use "RealityBending"

exports.handler = async (event, context) => {
    // content should be a dictionary with two attributes: 'path' and 'data'
    const content = JSON.parse(event.body);
    console.log(content)
    // authenticating with Octokit
    const octokit = new Octokit({
        auth: process.env.GH_TOKEN
    })

    // send request to update file content
    const response = await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        content: Buffer.from(content.data).toString('base64'),
        message: `Saving ${content.path}`,
        path: content.path,
        committer: {
            name: "RebelityBender",
            email: "realitybendinglab@gmail.com",
        },
        author: {
            name: "RebelityBender",
            email: "realitybendinglab@gmail.com",
        }
    })
    if (response.status == 200 || response.status == 201) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                result: "File updated."
            }),
        }
    }
    return {
        statusCode: response.status,
        body: JSON.stringify({
            result: "Unable to update file."
        })
    }

}
