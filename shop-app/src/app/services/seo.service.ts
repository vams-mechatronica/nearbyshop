import { Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class SeoService {

    constructor(@Inject(DOCUMENT) private document: Document, private meta: Meta, private title: Title) { }

    setCanonicalUrl(url?: string) {
        const canonicalUrl = url || this.document.location.href;

        let link: HTMLLinkElement =
            this.document.querySelector("link[rel='canonical']") ||
            this.document.createElement('link');

        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', canonicalUrl);

        if (!link.parentNode) {
            this.document.head.appendChild(link);
        }
    }
    setProductSEO(product: Product) {
        if (!product) return;

        const title =
            product.seo_title || `${product.name} | Buy Online Near You`;

        const description =
            product.seo_description ||
            product.description ||
            '';

        const keywords = product.seo_keywords || '';
        const image = product.seo_image || '';
        const url = `${this.document.location.origin}/product/${product.slug}`;

        // 🔥 TITLE
        this.title.setTitle(title);

        // 🔥 BASIC META
        this.meta.updateTag({ name: 'description', content: description });

        if (keywords) {
            this.meta.updateTag({ name: 'keywords', content: keywords });
        }

        // 🔥 OPEN GRAPH
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:type', content: 'product' });
        this.meta.updateTag({ property: 'og:url', content: url });

        if (image) {
            this.meta.updateTag({ property: 'og:image', content: image });
        }

        // 🔥 TWITTER
        this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: description });

        if (image) {
            this.meta.updateTag({ name: 'twitter:image', content: image });
        }
    }
    setProductSchema(product: Product) {
        if (!product) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.seo_title || product.name,
            "description": product.seo_description || product.description,
            "image": product.seo_image ? [product.seo_image] : [],
            "sku": product.sku || product.id,
            "brand": {
                "@type": "Brand",
                "name": product.name || "Local Brand"
            },
            "offers": {
                "@type": "Offer",
                "priceCurrency": "INR",
                "price": product.price,
                "availability": product.stock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                "url": this.document.location.href,
                "seller": {
                    "@type": "Organization",
                    "name": product.shop || "Local Store"
                }
            }
        };

        // 🔥 Remove existing schema to avoid duplicates
        const existingScript = this.document.getElementById('product-schema');
        if (existingScript) {
            existingScript.remove();
        }

        // 🔥 Inject fresh schema
        const script = this.document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'product-schema';
        script.text = JSON.stringify(schema);

        this.document.head.appendChild(script);
    }
    setVendorSEO(vendor: any) {
        if (!vendor) return;

        const title = `${vendor.name} | TheNearByShop`;

        const description =
            vendor.description ||
            `Shop online from ${vendor.name}. Order groceries, food, and daily essentials near you.`;

        const image = vendor.banner || vendor.shop_image || '';
        const url = `${this.document.location.origin}/shop/${vendor.slug}`;

        // 🔥 TITLE
        this.title.setTitle(title);

        // 🔥 BASIC META
        this.meta.updateTag({ name: 'description', content: description });

        // 🔥 OPEN GRAPH (WhatsApp uses this)
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:type', content: 'website' });
        this.meta.updateTag({ property: 'og:url', content: url });

        if (image) {
            this.meta.updateTag({ property: 'og:image', content: image });
        }

        // 🔥 TWITTER
        this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: description });

        if (image) {
            this.meta.updateTag({ name: 'twitter:image', content: image });
        }

        // 🔥 Canonical
        this.setCanonicalUrl(url);
    }

    setVendorSchema(vendor: any) {
        if (!vendor) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": vendor.name,
            "description": vendor.description || "",
            "image": vendor.banner || vendor.shop_image || "",
            "url": this.document.location.href,
            "telephone": vendor.phone || "",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": vendor.address || "",
                "addressLocality": vendor.city || "",
                "addressRegion": vendor.state || "",
                "postalCode": vendor.pincode || "",
                "addressCountry": "IN"
            },
            "geo": vendor.latitude && vendor.longitude ? {
                "@type": "GeoCoordinates",
                "latitude": vendor.latitude,
                "longitude": vendor.longitude
            } : undefined
        };

        // Remove old schema
        const existingScript = this.document.getElementById('vendor-schema');
        if (existingScript) {
            existingScript.remove();
        }

        const script = this.document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'vendor-schema';
        script.text = JSON.stringify(schema);

        this.document.head.appendChild(script);
    }

}
