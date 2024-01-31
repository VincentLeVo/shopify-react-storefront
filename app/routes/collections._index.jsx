import {useLoaderData, Link} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return json({collections});
}

export default function Collections() {
  /** @type {LoaderReturnData} */
  const {collections} = useLoaderData();

  return (
    <div className="collections mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Collections
      </h1>
      <p className="mt-4 text-base text-gray-500">
        Each season, we collaborate with world-class designers to create a
        collection inspired by the natural world.
      </p>
      <Pagination connection={collections}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <div>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            <CollectionsGrid collections={nodes} />
            <NextLink>
              {isLoading ? 'Loading...' : <span>Load more ↓</span>}
            </NextLink>
          </div>
        )}
      </Pagination>
    </div>
  );
}

/**
 * @param {{collections: CollectionFragment[]}}
 */
function CollectionsGrid({collections}) {
  return (
    <div className="collections-grid mt-10 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
      {collections.map((collection, index) => (
        <CollectionItem
          key={collection.id}
          collection={collection}
          index={index}
        />
      ))}
    </div>
  );
}

/**
 * @param {{
 *   collection: CollectionFragment;
 *   index: number;
 * }}
 */
function CollectionItem({collection, index}) {
  return (
    <Link
      className="collection-item group block"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection?.image && (
        <div
          aria-hidden="true"
          className="aspect-h-2 aspect-w-3 overflow-hidden rounded-lg lg:aspect-h-6 lg:aspect-w-5 group-hover:opacity-75"
        >
          <Image
            alt={collection.image.altText || collection.title}
            aspectRatio="1/1"
            data={collection.image}
            loading={index < 3 ? 'eager' : undefined}
            className="h-full w-full object-cover object-center"
          />
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {collection.title}
      </h3>
      <p className="mt-2 text-sm text-gray-500">{collection.description}</p>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    description
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('storefrontapi.generated').CollectionFragment} CollectionFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
