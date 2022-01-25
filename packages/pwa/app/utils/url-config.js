/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './utils'
import {urlPartPositions} from '../constants'
import {rebuildPathWithParams} from './url'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getDefaultSiteValues} from './site-utils'

/**
 * Rebuild the path with locale/site value to the path as url path or url query param
 * based on url config.
 * If the showDefault flag is set to false, the default value won't show up in the url
 * @param {string} path - the input path
 * @param {object} configValues - object that contains values of url param config
 * @return {string} - an output path
 *
 * @example
 * //pwa-kit.config.json
 * url {
 *    locale: {
 *        position: 'query_param',
 *        showDefault: true
 *    },
 *    site: {
 *        position: 'path',
 *        showDefault: false
 *    }
 * }
 *
 * // default locale: en-GB
 * // default site RefArch, alias us
 * buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'us', defaultLocale: 'en-GB'})
 * => /women/dresses?locale=en-GB
 * buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'global', defaultLocale: 'en-GB'})
 * => /global/women/dresses?locale=en-GB
 *
 */
export const buildPathWithUrlConfig = (path, configValues = {}) => {
    const urlConfig = getUrlConfig()
    if (!urlConfig || !Object.values(urlConfig).length) return path
    if (!Object.values(configValues).length) return path
    const queryParams = {}
    let basePathSegments = []
    const showDefault = urlConfig.showDefault
    const {defaultLocaleVal, defaultSiteVal} = getDefaultSiteValues()
    const options = ['site', 'locale']
    // if the showDefault is set to false, and when both locale and site are default values
    // then do not include them into the url
    if (
        defaultLocaleVal.includes(configValues.locale) &&
        defaultSiteVal.includes(configValues.site) &&
        !showDefault
    ) {
        return path
    }
    options.forEach((option) => {
        const position = urlConfig[option]
        if (position === urlPartPositions.PATH) {
            // otherwise, append to the array to construct url later
            basePathSegments.push(configValues[option])
        } else if (position === urlPartPositions.QUERY_PARAM) {
            // otherwise, append to the query to construct url later
            queryParams[option] = configValues[option]
        }
    })
    // filter out falsy values in the array
    basePathSegments = basePathSegments.filter(Boolean)
    let updatedPath = `${basePathSegments.length ? `/${basePathSegments.join('/')}` : ''}${path}`
    // append the query param to pathname
    if (Object.keys(queryParams).length) {
        updatedPath = rebuildPathWithParams(updatedPath, queryParams)
    }
    return updatedPath
}

/**
 * a function to return url config from pwa config file
 * First, it will look for the url config based on the current host
 * If none is found, it will return the default url config at the top level of the config file
 */
export const getUrlConfig = () => {
    const {hostname} = new URL(getAppOrigin())
    const urlConfig = getUrlConfigByHostname(hostname)
    if (urlConfig) {
        return urlConfig
    }
    return getConfig('app.url')
}

/**
 * Get the url config from pwa-kit.config.json based on a given hostname
 * @param {string} hostname
 * @returns {object|undefined} - url config from the input host
 */
export const getUrlConfigByHostname = (hostname) => {
    const hosts = getConfig('app.hosts')
    const host = hosts.find((host) => host.domain === hostname)
    return host?.url
}
