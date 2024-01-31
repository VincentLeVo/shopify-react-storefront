import {Suspense} from 'react';
import {defer, redirect} from '@shopify/remix-oxygen';
import {Await, Link, useLoaderData} from '@remix-run/react';
import {RadioGroup, Disclosure, Tab} from '@headlessui/react';
import {useState} from 'react';
import {useNavigate} from '@remix-run/react';

import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  CartForm,
} from '@shopify/hydrogen';
import {getVariantUrl} from '~/utils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.product.title ?? ''}`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, request, context}) {
  const {handle} = params;
  const {storefront} = context;

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // await the query for the critical product data
  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions},
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = storefront.query(VARIANTS_QUERY, {
    variables: {handle},
  });

  return defer({product, variants});
}

/**
 * @param {{
 *   product: ProductFragment;
 *   request: Request;
 * }}
 */
function redirectToFirstVariant({product, request}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, variants} = useLoaderData();
  const {selectedVariant, images} = product;
  return (
    <div className="product mx-auto mt-8 max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
      <ProductImage
        selectedVariantImage={selectedVariant?.image}
        images={images}
      />
      <ProductMain
        selectedVariant={selectedVariant}
        product={product}
        variants={variants}
      />
    </div>
  );
}

/**
 * @param {{image: ProductVariantFragment['image']}}
 */
function ProductImage({selectedVariantImage, images}) {
  return (
    <Tab.Group as="div" className="flex flex-col-reverse">
      {/* Image selector */}
      <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
        <Tab.List className="grid grid-cols-4 gap-6">
          {images.nodes.map((image) => (
            <Tab
              key={image.id}
              className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4"
            >
              {({selected}) => (
                <>
                  <span className="sr-only">{image.name}</span>
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <Image
                      data={image}
                      alt="selectedVariantImage.altText"
                      className="h-full w-full object-cover object-center"
                      sizes="(min-width: 400px) 400px, 50vw"
                    />
                  </span>
                  <span
                    className={classNames(
                      selected ? 'ring-emerald-500' : 'ring-transparent',
                      'pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-2',
                    )}
                    aria-hidden="true"
                  />
                </>
              )}
            </Tab>
          ))}
        </Tab.List>
      </div>

      <Tab.Panels className="aspect-h-1 aspect-w-1 w-full">
        {images.nodes.map((image) => (
          <Tab.Panel key={image.id}>
            <Image
              data={image}
              alt={image.altText}
              className="h-full w-full object-cover object-center sm:rounded-lg"
              sizes="(min-width: 1024px) 1024px, 100vw"
            />
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Promise<ProductVariantsQuery>;
 * }}
 */
function ProductMain({selectedVariant, product, variants}) {
  const {title, descriptionHtml} = product;
  return (
    <div className="product-main mt-8">
      <div className="flex justify-between">
        <h1 className="text-xl font-medium text-gray-900">{title}</h1>
        <ProductPrice
          className="text-xl font-medium text-gray-900"
          selectedVariant={selectedVariant}
        />
      </div>

      <br />
      <div className="mt-8 lg:col-span-5">
        <Suspense
          fallback={
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              variants={[]}
            />
          }
        >
          <Await
            errorElement="There was a problem loading product variants"
            resolve={variants}
          >
            {(data) => (
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={data.product?.variants.nodes || []}
              />
            )}
          </Await>
        </Suspense>
        {/* Product details */}
        <div className="mt-10">
          <h2 className="text-sm font-medium text-gray-900">Description</h2>

          <div
            className="prose prose-sm mt-4 text-gray-500"
            dangerouslySetInnerHTML={{__html: descriptionHtml}}
          />
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8"></div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   selectedVariant: ProductFragment['selectedVariant'];
 * }}
 */
function ProductPrice({selectedVariant}) {
  return (
    <div className="product-price">
      {selectedVariant?.compareAtPrice ? (
        <>
          <p>Sale</p>
          <br />
          <div className="product-price-on-sale">
            {selectedVariant ? <Money data={selectedVariant.price} /> : null}
            <s>
              <Money data={selectedVariant.compareAtPrice} />
            </s>
          </div>
        </>
      ) : (
        selectedVariant?.price && <Money data={selectedVariant?.price} />
      )}
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductFragment['selectedVariant'];
 *   variants: Array<ProductVariantFragment>;
 * }}
 */
function ProductForm({product, selectedVariant, variants}) {
  return (
    <div className="product-form">
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({option}) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>
      <br />
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          window.location.href = window.location.href + '#cart-aside';
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{option: VariantOption}}
 */
function ProductOptions({option, selectedVariant, setSelectedVariant}) {
  const navigate = useNavigate();
  const [selectedValue, setSelectedValue] = useState(
    selectedVariant?.title || '',
  );

  const handleSelectionChange = (value) => {
    setSelectedValue(value);
    const selectedOption = option.values.find((opt) => opt.value === value);
    if (selectedOption && selectedOption.to) {
      navigate(selectedOption.to, {replace: true});
    }
  };

  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
    olive: 'bg-lime-800', // Custom color
    ocean: 'bg-cyan-700', // Custom color
  };

  return (
    <div className="product-options" key={option.name}>
      <h5 className="text-sm font-medium text-gray-900">{option.name}</h5>
      <RadioGroup
        className="mt-2"
        value={selectedValue}
        onChange={handleSelectionChange}
      >
        <div className="product-options-grid flex items-center space-x-3">
          {option.values.map(({value, isAvailable}) => (
            <RadioGroup.Option
              key={value}
              value={value}
              disabled={!isAvailable}
              className={({active, checked}) => {
                let bgColorClass =
                  colorClasses[value.toLowerCase()] || 'bg-emerald-500';

                if (option.name == 'Color') {
                  // Styles specific to color options
                  return classNames(
                    bgColorClass,
                    'relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none',
                    active && checked ? 'ring ring-offset-1' : '',
                    !active && checked ? 'ring-2' : '',
                    !isAvailable ? 'cursor-not-allowed opacity-25' : '',
                  );
                } else {
                  // Default styles for other options
                  return `flex items-center justify-center rounded-md border py-3 px-3 text-sm font-medium uppercase sm:flex-1 ${
                    active ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                  } ${
                    checked
                      ? 'border-transparent bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  } ${!isAvailable ? 'cursor-not-allowed opacity-25' : ''}`;
                }
              }}
            >
              {option.name == 'Color' ? (
                <>
                  <RadioGroup.Label as="span" className="sr-only">
                    {value}
                  </RadioGroup.Label>
                  <span
                    aria-hidden="true"
                    className={classNames(
                      'h-8 w-8 rounded-full border border-black border-opacity-10',
                      // Add dynamic background color class here based on the value
                    )}
                  />
                </>
              ) : (
                // Render non-color options here
                <span>{value}</span>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
      <br />
    </div>
  );
}

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: CartLineInput[];
 *   onClick?: () => void;
 * }}
 */
function AddToCartButton({analytics, children, disabled, lines, onClick}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
            className="mt-8 flex w-full items-center justify-center rounded-md border border-transparent bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantsQuery} ProductVariantsQuery */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
/** @typedef {import('@shopify/hydrogen').VariantOption} VariantOption */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineInput} CartLineInput */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
