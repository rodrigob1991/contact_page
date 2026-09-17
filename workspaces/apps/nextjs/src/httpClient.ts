type PostEmailArgs = { 
    sender: {email: string, name?: string}
    receivers: {email: string, name?: string}[]
    subject: string
    message: string 
}
export const postEmail = ({sender, receivers, subject, message}: PostEmailArgs) => {
    const bodyParams = {
        sender,
        to: receivers,
        subject: subject,
        htmlContent: `<!DOCTYPE html><html><body>${message}</body></html>`
    }
    const succeedResultMessage = {succeed: true, message: "email sent"}
    const unsuccessResultMessage = {succeed: false, message: "email was not sent"}
    const logError = (error: unknown) => {
        console.error(`Error sending the email: ${JSON.stringify(error)}`)
    }
    return fetch(process.env.NEXT_PUBLIC_SENDINBLUE_URL as string, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "api-key": process.env.NEXT_PUBLIC_SENDINBLUE_API_KEY as string
        },
        body: JSON.stringify(bodyParams),
    }).then((response) => {
            let resultMessage
            if (response.ok) {
                resultMessage = succeedResultMessage
            } else {
                response.json().then(logError).catch(logError)
                resultMessage = unsuccessResultMessage
            }
            return resultMessage
        }
    )
}