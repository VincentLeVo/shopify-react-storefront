import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const featuredCollections = collections.nodes;
  const featuredCollection1 = collections.nodes[0];
  const featuredCollection2 = collections.nodes[1];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);

  return defer({
    featuredCollections,
    featuredCollection1,
    featuredCollection2,
    recommendedProducts,
  });
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      <HeroSection collection={data.featuredCollection1} />
      <RecommendedProducts products={data.recommendedProducts} />
      <CategorySection collections={data.featuredCollections} />

      <FeaturedCollection collection={data.featuredCollection2} />
    </div>
  );
}

function HeroSection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <div className="relative bg-gray-900">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <Image
          data={image}
          alt={image?.altText}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gray-900 opacity-50"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center sm:py-64 lg:px-0">
        <h1 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
          {collection.title}
        </h1>
        <p className="mt-4 text-xl text-white">
          The new arrivals have, well, newly arrived. Check out the latest
          options from our summer small-batch release while they're still in
          stock.
        </p>
        <a
          href="#"
          className="mt-8 inline-block rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100"
        >
          Shop {collection.title} collection
        </a>
      </div>
    </div>
  );
}

function CategorySection({collections}) {
  return (
    <section
      aria-labelledby="category-heading"
      className="pt-24 sm:pt-32 xl:mx-auto xl:max-w-7xl xl:px-8"
    >
      <div className="px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-0">
        <h2
          id="category-heading"
          className="text-2xl font-bold tracking-tight text-gray-900"
        >
          Shop by Category
        </h2>
        <a
          href="#"
          className="hidden text-sm font-semibold text-emerald-600 hover:text-emerald-500 sm:block"
        >
          Browse all categories
          <span aria-hidden="true"> &rarr;</span>
        </a>
      </div>

      <div className="mt-4 flow-root">
        <div className="-my-2">
          <div className="relative box-content overflow-x-auto py-2 xl:overflow-visible">
            <div className="grid gap-x-6 gap-y-10 px-4 sm:grid-cols-2 sm:px-6 lg:px-8 lg:grid-cols-4 xl:relative xl:grid xl:grid-cols-4 xl:gap-8 xl:space-x-0 xl:px-0">
              {collections.map((collection) => (
                <Link
                  key={collection.title}
                  to={`/collections/${collection.handle}`}
                  className="relative flex h-80 w-56 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 xl:w-auto"
                >
                  <span aria-hidden="true" className="absolute inset-0">
                    <Image
                      data={collection.image}
                      alt={collection.image?.altText}
                      className="h-full w-full object-cover object-center"
                      sizes="(min-width: 45em) 20vw, 50vw"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50"
                  />
                  <span className="relative mt-auto text-center text-xl font-bold text-white">
                    {collection.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 px-4 sm:hidden">
        <a
          href="#"
          className="block text-sm font-semibold text-emerald-600 hover:text-emerald-500"
        >
          Browse all categories
          <span aria-hidden="true"> &rarr;</span>
        </a>
      </div>
    </section>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <section
      aria-labelledby="social-impact-heading"
      className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-lg">
        <div className="absolute inset-0">
          <Image
            data={image}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="relative bg-gray-900 bg-opacity-75 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2
              id="social-impact-heading"
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              <span className="block sm:inline">Level up</span>
              <span className="block sm:inline"> your collections</span>
            </h2>
            <p className="mt-3 text-xl text-white">{collection.description}</p>
            <Link
              to={`/collections/${collection.handle}`}
              className="mt-8 block w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
            >
              Shop Workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <section className="">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="sm:flex sm:items-baseline sm:justify-between">
          <h2
            id="favorites-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            Our Favorites
          </h2>
          <Link
            to="/collections/"
            className="hidden text-sm font-semibold text-emerald-600 hover:text-emerald-500 sm:block"
          >
            Browse all favorites
            <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <Await resolve={products}>
            {({products}) => (
              <div className="mt-6 grid grid-cols-1 gap-y-10 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-0 lg:gap-x-8">
                {products.nodes.map((product) => (
                  <Link
                    key={product.id}
                    className=""
                    to={`/products/${product.handle}`}
                  >
                    <div key={product.id} className="group relative">
                      <div className="aspect-[1/1] w-full overflow-hidden rounded-lg sm:aspect-[2/3]">
                        <Image
                          data={product.featuredImage}
                          alt={product.featuredImage?.altText}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-gray-900">
                        {product.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        <Money data={product.priceRange.minVariantPrice} />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Await>
        </Suspense>
        <br />
      </div>
    </section>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    description
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 6, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 5) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
