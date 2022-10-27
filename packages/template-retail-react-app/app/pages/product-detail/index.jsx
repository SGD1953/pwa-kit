/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Button,
    Stack
} from '@chakra-ui/react'

// Hooks
// import useBasket from '../../commerce-api/hooks/useBasket'
import {useVariant} from '../../hooks'
import useWishlist from '../../hooks/use-wishlist'
import useNavigation from '../../hooks/use-navigation'
import useEinstein from '../../commerce-api/hooks/useEinstein'

// Project Components
import RecommendedProducts from '../../components/recommended-products'
import ProductView from '../../partials/product-view'

// Others/Utils
// import {HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'

// constant
import {
    API_ERROR_MESSAGE,
    // MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST
} from '../../constants'
import {rebuildPathWithParams} from '../../utils/url'
import {useHistory, useParams, useLocation} from 'react-router-dom'
import {useToast} from '../../hooks/use-toast'
import {useCategory, useProduct, useShopperBasketsMutation} from 'commerce-sdk-react'
import {useBasket as useBasketHook} from '../../hooks/useBasket'

const ProductDetail = () => {
    const {formatMessage} = useIntl()
    // const basket = useBasket()
    const history = useHistory()
    const location = useLocation()
    const einstein = useEinstein()
    const toast = useToast()
    const navigate = useNavigation()

    //===================== Commerce react hooks==========================//
    // **************Basket******************** //
    const {baskets, hasBasket} = useBasketHook()
    const createBasket = useShopperBasketsMutation('createBasket')
    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')

    // ************************** Product and category ************************//
    //TODO: Fix loading problem when fetching variants
    const {productId} = useParams()
    const urlParams = new URLSearchParams(location.search)
    const {data: product, isLoading: isProductLoading, error: productError} = useProduct({
        id: urlParams.get('pid') || productId,
        allImages: true
    })
    // only fetch category on master product
    const {data: category, error: categoryError} = useCategory(
        {id: product?.primaryCategoryId, levels: 1},
        {enabled: !!product?.primaryCategoryId}
    )
    //===============================================================//
    const variant = useVariant(product)

    const [primaryCategory, setPrimaryCategory] = useState(category)
    console.log('product', product)

    // This page uses the `primaryCategoryId` to retrieve the category data. This attribute
    // is only available on `master` products. Since a variation will be loaded once all the
    // attributes are selected (to get the correct inventory values), the category information
    // is overridden. This will allow us to keep the initial category around until a different
    // master product is loaded.
    useEffect(() => {
        if (category) {
            setPrimaryCategory(category)
        }
    }, [category])

    /**************** Product Variant ****************/
    useEffect(() => {
        if (!variant?.productId) {
            return
        }
        // update the variation attributes parameter on
        // the url accordingly as the variant changes
        const updatedUrl = rebuildPathWithParams(`${location.pathname}${location.search}`, {
            pid: variant?.productId
        })
        history.replace(updatedUrl)
    }, [variant?.productId])

    /**************** Wishlist ****************/
    const wishlist = useWishlist()
    // TODO: DRY this handler when intl provider is available globally
    const handleAddToWishlist = async (quantity) => {
        try {
            await wishlist.createListItem({
                id: product.id,
                quantity
            })
            toast({
                title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                status: 'success',
                action: (
                    // it would be better if we could use <Button as={Link}>
                    // but unfortunately the Link component is not compatible
                    // with Chakra Toast, since the ToastManager is rendered via portal
                    // and the toast doesn't have access to intl provider, which is a
                    // requirement of the Link component.
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        } catch {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }
    }

    /**************** Add To Cart ****************/
    const showToast = useToast()
    const showError = () => {
        showToast({
            title: formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }
    const handleAddToCart = async (variant, quantity) => {
        try {
            if (!variant?.orderable || !quantity) return
            // The basket accepts an array of `ProductItems`, so lets create a single
            // item array to add to the basket.

            if (!hasBasket) {
                createBasket.mutate({body: {}})
            }

            const productItems = [
                {
                    productId: variant.productId,
                    quantity,
                    price: variant.price
                }
            ]
            // get the first basket
            const basketId = baskets.data?.baskets ? baskets.data?.baskets[0].basketId : ''
            console.log('basketId', basketId)

            addItemToBasket.mutate({parameters: {basketId}, body: productItems})
            // await basket.addItemToBasket(productItems)
        } catch (error) {
            showError(error)
        }
    }

    /**************** Einstein ****************/
    // useEffect(() => {
    //     if (product) {
    //         einstein.sendViewProduct(product)
    //     }
    // }, [product])

    if (productError || categoryError) {
        return (
            <Box
                className="sf-product-detail-page"
                layerStyle="page"
                data-testid="product-details-page"
            >
                <div>Error: {productError.toString() || categoryError.toString()}</div>
            </Box>
        )
    }
    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            <Helmet>
                <title>{product?.pageTitle}</title>
                <meta name="description" content={product?.pageDescription} />
            </Helmet>

            <Stack spacing={16}>
                <ProductView
                    product={product}
                    category={primaryCategory?.parentCategoryTree || []}
                    addToCart={(variant, quantity) => handleAddToCart(variant, quantity)}
                    addToWishlist={(_, quantity) => handleAddToWishlist(quantity)}
                    isProductLoading={isProductLoading}
                    isCustomerProductListLoading={!wishlist.isInitialized}
                />
                Information Accordion
                <Stack direction="row" spacing={[0, 0, 0, 16]}>
                    <Accordion allowMultiple allowToggle maxWidth={'896px'} flex={[1, 1, 1, 5]}>
                        {/* Details */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Product Detail',
                                            id: 'product_detail.accordion.button.product_detail'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: product?.longDescription
                                    }}
                                />
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Size & Fit */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Size & Fit',
                                            id: 'product_detail.accordion.button.size_fit'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                {formatMessage({
                                    defaultMessage: 'Coming Soon',
                                    id: 'product_detail.accordion.message.coming_soon'
                                })}
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Reviews */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Reviews',
                                            id: 'product_detail.accordion.button.reviews'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                {formatMessage({
                                    defaultMessage: 'Coming Soon',
                                    id: 'product_detail.accordion.message.coming_soon'
                                })}
                            </AccordionPanel>
                        </AccordionItem>

                        {/* Questions */}
                        <AccordionItem>
                            <h2>
                                <AccordionButton height="64px">
                                    <Box flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                                        {formatMessage({
                                            defaultMessage: 'Questions',
                                            id: 'product_detail.accordion.button.questions'
                                        })}
                                    </Box>
                                    <AccordionIcon />
                                </AccordionButton>
                            </h2>
                            <AccordionPanel mb={6} mt={4}>
                                {formatMessage({
                                    defaultMessage: 'Coming Soon',
                                    id: 'product_detail.accordion.message.coming_soon'
                                })}
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                    <Box display={['none', 'none', 'none', 'block']} flex={4}></Box>
                </Stack>
                Product Recommendations
                {/*<Stack spacing={16}>*/}
                {/*    <RecommendedProducts*/}
                {/*        title={*/}
                {/*            <FormattedMessage*/}
                {/*                defaultMessage="Complete the Set"*/}
                {/*                id="product_detail.recommended_products.title.complete_set"*/}
                {/*            />*/}
                {/*        }*/}
                {/*        recommender={'complete-the-set'}*/}
                {/*        products={product && [product.id]}*/}
                {/*        mx={{base: -4, md: -8, lg: 0}}*/}
                {/*        shouldFetch={() => product?.id}*/}
                {/*    />*/}
                {/*    <RecommendedProducts*/}
                {/*        title={*/}
                {/*            <FormattedMessage*/}
                {/*                defaultMessage="You might also like"*/}
                {/*                id="product_detail.recommended_products.title.might_also_like"*/}
                {/*            />*/}
                {/*        }*/}
                {/*        recommender={'pdp-similar-items'}*/}
                {/*        products={product && [product.id]}*/}
                {/*        mx={{base: -4, md: -8, lg: 0}}*/}
                {/*        shouldFetch={() => product?.id}*/}
                {/*    />*/}
                {/*    <RecommendedProducts*/}
                {/*        title={*/}
                {/*            <FormattedMessage*/}
                {/*                defaultMessage="Recently Viewed"*/}
                {/*                id="product_detail.recommended_products.title.recently_viewed"*/}
                {/*            />*/}
                {/*        }*/}
                {/*        recommender={'viewed-recently-einstein'}*/}
                {/*        mx={{base: -4, md: -8, lg: 0}}*/}
                {/*    />*/}
                {/*</Stack>*/}
            </Stack>
        </Box>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

// ProductDetail.shouldGetProps = ({previousLocation, location}) => {
//     const previousParams = new URLSearchParams(previousLocation?.search || '')
//     const params = new URLSearchParams(location.search)
//
//     // If the product changed via the pathname or `pid` param, allow updated
//     // data to be retrieved.
//     return (
//         previousLocation?.pathname !== location.pathname ||
//         previousParams.get('pid') !== params.get('pid')
//     )
// }

// ProductDetail.getProps = async ({res, params, location, api}) => {
//     const {productId} = params
//     let category, product
//     const urlParams = new URLSearchParams(location.search)
//
//     product = await api.shopperProducts.getProduct({
//         parameters: {
//             id: urlParams.get('pid') || productId,
//             allImages: true
//         }
//     })
//
//     if (product?.primaryCategoryId) {
//         category = await api.shopperProducts.getCategory({
//             parameters: {id: product?.primaryCategoryId, levels: 1}
//         })
//     }
//
//     // Set the `cache-control` header values similar to those on the product-list.
//     if (res) {
//         res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
//     }
//
//     // The `commerce-isomorphic-sdk` package does not throw errors, so
//     // we have to check the returned object type to inconsistencies.
//     if (typeof product?.type === 'string') {
//         throw new HTTPNotFound(product.detail)
//     }
//     if (typeof category?.type === 'string') {
//         throw new HTTPNotFound(category.detail)
//     }
//
//     return {category, product}
// }

ProductDetail.propTypes = {
    /**
     * The category object used for breadcrumb construction.
     */
    category: PropTypes.object,
    /**
     * The product object to be shown on the page..
     */
    product: PropTypes.object,
    /**
     * The current state of `getProps` when running this value is `true`, otherwise it's
     * `false`. (Provided internally)
     */
    isLoading: PropTypes.bool,
    /**
     * The current react router match object. (Provided internally)
     */
    match: PropTypes.object
}

export default ProductDetail
