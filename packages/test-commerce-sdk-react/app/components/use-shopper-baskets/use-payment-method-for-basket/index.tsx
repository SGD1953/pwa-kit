import React, {ReactElement} from 'react'
import Json from '../../Json'
import {usePaymentMethodsForBasket} from 'commerce-sdk-react'

export const UsePaymentMethodsForBasket = ({basketId}: {basketId: string}): ReactElement | null => {
    const {isLoading, error, data} = usePaymentMethodsForBasket({basketId}, {enabled: !!basketId})

    if (!basketId) {
        return null
    }

    if (isLoading) {
        return (
            <div>
                <h1>Payment Methods</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            {data && (
                <>
                    <h2>usePaymentMethodsForBasket</h2>
                    <Json data={{isLoading, error, data}} />
                </>
            )}
        </>
    )
}