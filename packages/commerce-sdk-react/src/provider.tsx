/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement, useEffect, useState} from 'react'
import {
    ShopperBaskets,
    ShopperContexts,
    ShopperCustomers,
    ShopperLogin,
    ShopperOrders,
    ShopperProducts,
    ShopperPromotions,
    ShopperDiscoverySearch,
    ShopperGiftCertificates,
    ShopperSearch,
} from 'commerce-sdk-isomorphic'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients} from './hooks/types'

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
    redirectURI: string
}

/**
 * @internal
 */
export const CommerceApiContext = React.createContext({} as ApiClients)

/**
 * @internal
 */
export const AuthContext = React.createContext({} as Auth)

// // TODO: re-use ApiClientConfigParams
// interface ApiClientConfigs {
//     proxy: string
//     headers: Record<string, string>
//     parameters: {
//         clientId: string
//         organizationId: string
//         shortCode: string
//         siteId: string
//     }
//     throwOnBadResponse: boolean
// }

/**
 * Initialize a set of Commerce API clients and make it available to all of descendant components
 *
 * @param props
 * @returns Provider to wrap your app with
 */
const CommerceApiProvider = (props: CommerceApiProviderProps): ReactElement => {
    const {children, clientId, organizationId, shortCode, siteId, proxy, redirectURI} = props

    const config = {
        proxy,
        headers: {},
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId,
        },
        throwOnBadResponse: true,
    }

    // Warning: do not set state, it will trigger Provider re-render
    const [apiClients] = useState<ApiClients>({
        shopperBaskets: new ShopperBaskets(config),
        shopperContexts: new ShopperContexts(config),
        shopperCustomers: new ShopperCustomers(config),
        shopperDiscoverySearch: new ShopperDiscoverySearch(config),
        shopperGiftCertificates: new ShopperGiftCertificates(config),
        shopperLogin: new ShopperLogin(config),
        shopperOrders: new ShopperOrders(config),
        shopperProducts: new ShopperProducts(config),
        shopperPromotions: new ShopperPromotions(config),
        shopperSearch: new ShopperSearch(config),
    })

    // Warning: do not set state, it will trigger Provider re-render
    const [auth] = useState(
        new Auth({
            clientId,
            organizationId,
            shortCode,
            siteId,
            proxy,
            redirectURI,
        })
    )
    console.log('provider render')

    // TODO: to be replaced by useServerEffect
    useEffect(() => {
        // trigger auth initialization flow
        auth.ready()
    }, [])

    // TODO: wrap the children with:
    // - context for enabling useServerEffect hook
    // - context for sharing the auth object that would manage the tokens -> this will probably be for internal use only
    return (
        <CommerceApiContext.Provider value={apiClients}>
            <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
        </CommerceApiContext.Provider>
    )
}

export default CommerceApiProvider