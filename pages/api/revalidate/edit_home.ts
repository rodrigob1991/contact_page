// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import {RevalidationResponseBody} from "../../../types/Revalidation";

export default async function handler(req: NextApiRequest, res: NextApiResponse<RevalidationResponseBody>) {
  let httpCode: number
  let body: RevalidationResponseBody

  if (req.query.secret !== process.env.REVALIDATION_TOKEN) {
    httpCode = 401
    body = {message: 'Invalid token'}
  } else {

    try {
      await res.unstable_revalidate('/')
      httpCode = 200
      body = {message: 'successfully revalidated'}
    } catch (err) {
      // If there was an error, Next.js will continue
      // to show the last successfully generated page
      httpCode = 500
      body = {message: 'Error revalidating'}
    }
  }

  res.status(httpCode).json(body)
}
