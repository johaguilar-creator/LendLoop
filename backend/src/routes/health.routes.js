import { Router } from 'express'
import { sendSuccess } from '../utils/response.js'

const router = Router()

router.get('/', (_request, response) => {
  return sendSuccess(response, { status: 'ok' })
})

export default router
