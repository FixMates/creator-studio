import { ProductRedirect } from "@/components/storefront/product-redirect";
export default async function GoPage({params}:{params:Promise<{productId:string}>}){const{productId}=await params;return <ProductRedirect productId={productId}/>;}
