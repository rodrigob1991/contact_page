import styled from "@emotion/styled"
import { IoIosMail } from "react-icons/io"
import { maxWidthSmallestLayout } from "../../../../../layouts"
import { tooltipStyle } from "../../../../../theme"
import { useFormModal } from "../../../../FormComponents"
import WithTooltip from "../../../../WithTooltip"
import { TfiEmail } from "react-icons/tfi";

export default function SendEmail() {
    const sendEmail = ({from, subject, message}: { from: string, subject: string, message: string }) => {
        const bodyParams = {
            sender: {email: from},
            to: [{email: process.env.NEXT_PUBLIC_MY_EMAIL, name: "Rodrigo"}],
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
                let nextThenArg
                if (response.ok) {
                    nextThenArg = "ok"
                } else {
                    nextThenArg = response.json()
                }
                return nextThenArg
            }
        ).then((resultMessageOrBody) => {
            let resultMessage
            if (resultMessageOrBody === "ok") {
                resultMessage = succeedResultMessage
            } else {
                resultMessage = unsuccessResultMessage
                logError(resultMessageOrBody)
            }
            return resultMessage
        }).catch((e) => {
            logError(e)
            return unsuccessResultMessage
        })
    }

    const [showSendMessageModal, sendMessageModal] = useFormModal(
        {
            inputElementsProps: {
                from: {
                    type: "textInputEmail",
                    required: true,
                    placeholder: "from",
                    width: 300,
                    style: {fontSize: "2rem"}
                },
                subject: {type: "textInput", placeholder: "subject", width: 300, style: {fontSize: "2rem"}},
                message: {
                    type: "textAreaInput",
                    required: true,
                    placeholder: "message",
                    height: 250,
                    width: 300,
                    style: {fontSize: "2rem"}
                }
            },
            processSubmission: sendEmail,
            position: {left: 50, top: 40},
            resultMessageStyle: {fontStyle: "2rem"},
            button: {text: "SEND EMAIL", style: {fontSize: "1.7rem"}}
        })

    return (
        <>
            {sendMessageModal}
            <WithTooltip tooltipText={"send email"}
                         tooltipDeviation={{top: 0, left: 15}}
                         tooltipStyle={tooltipStyle}>
            <SendEmailImage onClick={(e) => {showSendMessageModal()}}/>
            </WithTooltip>
        </>

    )
}
const SendEmailImage = styled(IoIosMail)`
  width: 60px;
  height:60px;
  color: white;
  cursor: pointer;
   @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 40px;
    height: 40px;
  }
    `