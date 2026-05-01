interface Checkout_CartItem {
  id: "string";
  amount: number;
  price: number;
  product_details: {
    category: string;
    collectionId: string;
    collectionName: string;
    created: string;
    description: string;
    id: string;
    images: string[];
    mainColor: string;
    preview: string;
    price: number;
    published: boolean;
    secondaryColor: string;
    tags: string[];
    title: string;
    updated: string;
  };
}
[];
