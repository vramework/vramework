import {
  CoreAPIChannel,
  ChannelsMeta,
  CoreAPIChannels,
} from './channel.types.js'
import { match } from 'path-to-regexp'

if (!globalThis.vramework?.channels) {
  globalThis.vramework = globalThis.vramework || {}
  globalThis.vramework.channels = []
  globalThis.vramework.channelsMeta = []
}

const channels = (data?: any): CoreAPIChannels => {
  if (data) {
    globalThis.vramework.channels = data
  }
  return globalThis.vramework.channels
}

const channelsMeta = (data?: any): ChannelsMeta => {
  if (data) {
    globalThis.vramework.channelsMeta = data
  }
  return globalThis.vramework.channelsMeta
}

/**
 * Returns all the registered routes and associated metadata.
 * @internal
 */
export const getChannels = () => {
  return {
    channels: channels(),
    channelsMeta: channelsMeta(),
  }
}

export const addChannel = <
  In,
  Channel extends string,
  ChannelFunction,
  ChannelFunctionSessionless,
  APIPermission,
>(
  channel: CoreAPIChannel<
    In,
    Channel,
    ChannelFunction,
    ChannelFunctionSessionless,
    APIPermission
  >
) => {
  channels().push(channel as any)
}

/**
 * @ignore
 */
export const setChannelsMeta = (_channelsMeta: ChannelsMeta) => {
  channelsMeta(_channelsMeta)
}

export const getMatchingChannelConfig = (requestPath: string) => {
    const { channels, channelsMeta } = getChannels()
    for (const channelConfig of channels) {
        const matchFunc = match(channelConfig.channel.replace(/^\/\//, '/'), {
            decode: decodeURIComponent,
        })
        const matchedPath = matchFunc(requestPath.replace(/^\/\//, '/'))
        if (matchedPath) {
            const schemaName = channelsMeta.find(
                (channelMeta) => channelMeta.channel === channelConfig.channel
            )?.input
            return {
                matchedPath,
                params: matchedPath.params,
                channelConfig,
                schemaName,
            }
        }
    }

    return null
}
