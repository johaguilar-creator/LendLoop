import mongoose from 'mongoose'
import { Conversation, Message, Notification } from '../models/index.js'
import { ApiError } from '../middleware/ApiError.js'
import { sendSuccess } from '../utils/response.js'

export async function listConversations(request, response) {
  const conversations = await Conversation.find({
    participants: request.user.id,
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate('participants', 'name avatarUrl')
    .populate({
      path: 'loan',
      select: 'item dueAt status',
      populate: { path: 'item', select: 'title imageUrl' },
    })
  return sendSuccess(response, { conversations })
}

async function findConversation(conversationId, userId) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  })
  if (!conversation) {
    throw new ApiError(
      404,
      'CONVERSATION_NOT_FOUND',
      'Conversation not found.',
    )
  }
  return conversation
}

export async function listMessages(request, response) {
  const { conversationId } = request.validated.params
  const { page, limit } = request.validated.query
  const conversation = await findConversation(conversationId, request.user.id)
  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversation.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatarUrl'),
    Message.countDocuments({ conversation: conversation.id }),
  ])
  return sendSuccess(response, {
    messages: messages.reverse(),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function sendMessage(request, response) {
  const { conversationId } = request.validated.params
  const session = await mongoose.startSession()
  let message
  let recipientId

  try {
    await session.withTransaction(async () => {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: request.user.id,
      }).session(session)
      if (!conversation) {
        throw new ApiError(
          404,
          'CONVERSATION_NOT_FOUND',
          'Conversation not found.',
        )
      }

      recipientId = conversation.participants.find(
        (participant) => !participant.equals(request.user.id),
      )
      if (!recipientId) {
        throw new ApiError(
          409,
          'INVALID_CONVERSATION',
          'Conversation participants are invalid.',
        )
      }

      const [createdMessage] = await Message.create(
        [
          {
            conversation: conversation.id,
            sender: request.user.id,
            body: request.validated.body.body,
            readBy: [request.user.id],
          },
        ],
        { session },
      )
      conversation.lastMessageAt = createdMessage.createdAt
      await conversation.save({ session })
      message = createdMessage
      await Notification.create(
        [
          {
            recipient: recipientId,
            type: 'message',
            title: 'New message',
            message: `${request.user.name} sent you a message.`,
            resourceType: 'conversation',
            resourceId: conversation.id,
          },
        ],
        { session },
      )
    })
  } finally {
    await session.endSession()
  }

  await message.populate('sender', 'name avatarUrl')
  return sendSuccess(response, { message }, 201)
}

export async function markMessagesRead(request, response) {
  const { conversationId } = request.validated.params
  const conversation = await findConversation(conversationId, request.user.id)
  const result = await Message.updateMany(
    {
      conversation: conversation.id,
      sender: { $ne: request.user.id },
      readBy: { $ne: request.user.id },
    },
    { $addToSet: { readBy: request.user.id } },
  )
  return sendSuccess(response, { updated: result.modifiedCount })
}
