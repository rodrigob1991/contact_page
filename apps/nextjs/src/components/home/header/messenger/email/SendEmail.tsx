import styled from "@emotion/styled"
import { IoIosMail } from "react-icons/io"
import { maxWidthSmallestLayout } from "../../../../../layouts"
import { tooltipStyle } from "../../../../../theme"
import WithTooltip from "../../../../WithTooltip"
import useFormModal from "../../../../../hooks/with_jsx/forms/useFormModal"
import { postEmail } from "../../../../../httpClient"

export default function SendEmail() {
    /* const sendEmail = ({from, subject, message}: { from: string, subject: string, message: string }) => {
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
    } */

    const sendEmail = ({from, subject, message}: {from: string, subject: string, message: string}) => postEmail({sender: {email: from}, receivers: [{email: process.env.NEXT_PUBLIC_MY_EMAIL as string, name: "rodrigo"}], subject, message})

    const [showSendMessageModal, sendMessageModal] = useFormModal({
                                                                    inputsProps: {
                                                                        from: {
                                                                            type: "textInput",
                                                                            props: {
                                                                                    required: true,
                                                                                    email: true,
                                                                                    placeholder: "from"
                                                                                    }
                                                                        },
                                                                        subject: {
                                                                            type: "textInput",
                                                                            props: {
                                                                                    placeholder: "subject",
                                                                                    style: {fontSize: "2rem"}
                                                                                    }
                                                                        },
                                                                        message: {
                                                                            type: "textAreaInput",
                                                                            props: {
                                                                                    required: true,
                                                                                    placeholder: "message",
                                                                                    style: {fontSize: "2rem"}
                                                                                    }
                                                                        }
                                                                    },
                                                                    submissionAction: sendEmail,
                                                                    buttonText: "SEND EMAIL"
                                                                })
                                                        
    return <>
           {sendMessageModal}
           <WithTooltip renderChildren={(handlers) => <SendEmailImage onClick={(e) => {showSendMessageModal(true)}} {...handlers}/>}
                        tooltipText={"send email"} tooltipDeviation={{top: 0, left: 15}} tooltipStyle={tooltipStyle}/>
           </>

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