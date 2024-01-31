import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';

/**
 * @param {{
 *   product: ProductItemFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  return (
    <Link className="" key={product.id} prefetch="intent" to={variantUrl}>
      <div key={product.id} className="group relative">
        <div className="aspect-[1/1] w-full overflow-hidden rounded-lg sm:aspect-[2/3]">
          {product.featuredImage && (
            <Image
              alt={product.featuredImage.altText || product.title}
              data={product.featuredImage}
              loading={loading}
              sizes="(min-width: 45em) 400px, 100vw"
              className="h-full w-full object-cover object-center group-hover:opacity-75"
            />
          )}
        </div>
        <div className="mt-4 flex justify-between">
          <div className="flex items-center justify-between text-base font-medium text-gray-900">
            <h3>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.title}
            </h3>
            <p>{product.color}</p>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {' '}
            <Money data={product.priceRange.minVariantPrice} />
          </p>
        </div>
      </div>
    </Link>
  );
}
export const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;
