import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem, PRODUCT_ITEM_FRAGMENT} from '../components/ProductItem';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, params, context}) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    return redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  return json({collection});
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection} = useLoaderData();

  return (
    <div className="collection bg-gray-50 mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
      <div className="py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          {collection.title}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-gray-500">
          {collection.description}
        </p>
      </div>
      <Pagination
        connection={collection.products}
        className="mx-auto mt-6 flex max-w-7xl justify-between px-4 text-sm font-medium text-gray-700 sm:px-6 lg:px-8"
      >
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <>
            <PreviousLink className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 my-4 hover:bg-gray-100 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-opacity-25 focus:ring-offset-1 focus:ring-offset-emerald-600">
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            <ProductsGrid products={nodes} />
            <br />
            <NextLink className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 hover:bg-gray-100 my-4 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-opacity-25 focus:ring-offset-1 focus:ring-offset-emerald-600">
              {isLoading ? 'Loading...' : <span>Load more ↓</span>}
            </NextLink>
          </>
        )}
      </Pagination>
    </div>
  );
}

/**
 * @param {{products: ProductItemFragment[]}}
 */
function ProductsGrid({products}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
