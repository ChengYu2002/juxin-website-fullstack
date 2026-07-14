const products = [
  // JX-25ZP
  {
    id: 'JX-25ZP',
    name: 'JX-25ZP',

    // 用于 Products 页分类
    category: 'utility-trolley',

    // 业务字段
    moq: 2000,

    variants: [
      {
        key: 'black',
        label: 'Black',
        images: [
          '/images/JX_25ZP/black/1.jpg',
          '/images/JX_25ZP/black/2.jpg',
          '/images/JX_25ZP/black/3.jpg',
          '/images/JX_25ZP/black/4.jpg',
        ],
      },
    ],

    specs: {
      max_Size: '36.5 x 31 x 87 cm',
      folded_Size: '51 x 31 x 9.5 cm',
      carton_Size: '52 x 31.5 x 55.5 cm',
      pcsPer_Carton: 12,
      net_Weight: '20 kg',
      gross_Weight: '21.5 kg',
      wheel_Size: '90 mm',
      container_Load: '20GP: 3696 pcs \n 40GP: 7656 pcs \n 40HQ: 8976 pcs',
    },

    // 推荐部分
    isPopular: true,
    profitMargin: 'low',


  },

  // jx-C3D
  {
    id: 'JX-C3D',
    name: 'JX-C3D',

    // 用于 Products 页分类
    category: 'shopping-trolley',

    // 业务字段
    moq: 1000,

    variants: [
      {
        key: 'blue',
        label: 'Blue',
        images: [
          '/images/JX_C3D/blue/1.jpg',
          '/images/JX_C3D/blue/2.jpg',
          '/images/JX_C3D/blue/3.jpg',
          '/images/JX_C3D/blue/4.jpg',
        ],
      },
      {
        key: 'reddish_brown',
        label: 'Reddish Brown',
        images: [
          '/images/JX_C3D/reddish_brown/1.jpg',
          '/images/JX_C3D/reddish_brown/2.jpg',
        ],
      },
    ],

    specs: {
      max_Size: '56 x 41 x 92 cm',
      carton_Size: '88 x 42.5 x 36 cm',
      pcsPer_Carton: 6,
      net_Weight: '17.5 kg',
      gross_Weight: '18.5 kg',
      wheel_Size: '90 mm',
      container_Load: '20GP: 1242 pcs \n 40GP: 2574 pcs \n 40HQ: 3018 pcs',
    },

    // 推荐部分
    isPopular: false,
    profitMargin: 'low',

  },

  // JX-A2D
  {
    id: 'jx-A2D',
    name: 'JX-A2D',

    // 用于 Products 页分类
    category: 'shopping-trolley',

    // 业务字段
    moq: 1000,

    variants: [
      {
        key: 'rose_pink',
        label: 'Rose Pink',
        images: [
          '/images/JX_A2D/rose_pink/1.jpg',
          '/images/JX_A2D/rose_pink/2.jpg',
          '/images/JX_A2D/rose_pink/3.jpg',
          '/images/JX_A2D/rose_pink/4.jpg'
        ],
      },
      {
        key: 'burgundy_floral',
        label: 'Burgundy Floral',
        images: [
          '/images/JX_A2D/burgundy_floral/1.jpg',
          '/images/JX_A2D/burgundy_floral/2.jpg',
          '/images/JX_A2D/burgundy_floral/3.jpg',
          '/images/JX_A2D/burgundy_floral/4.jpg'
        ],
      },
      {
        key: 'sky_blue_floral',
        label: 'Sky Blue Floral',
        images: [
          '/images/JX_A2D/sky_blue_floral/1.jpg',
          '/images/JX_A2D/sky_blue_floral/2.jpg',
          '/images/JX_A2D/sky_blue_floral/3.jpg',
          '/images/JX_A2D/sky_blue_floral/4.jpg',
        ],
      },
      {
        key: 'coffee_polka_dot',
        label: 'Coffee Polka Dot',
        images: [
          '/images/JX_A2D/coffee_polka_dot/1.jpg',
          '/images/JX_A2D/coffee_polka_dot/2.jpg',
          '/images/JX_A2D/coffee_polka_dot/3.jpg',
          '/images/JX_A2D/coffee_polka_dot/4.jpg',
        ],
      },
    ],

    specs: {
      product_Size: '34 x 29 x 96 cm',
      carton_Size: '92 x 36 x 32 cm',
      pcsPer_Carton: 10,
      net_Weight: '16 kg',
      gross_Weight: '17 kg',
      wheel_Size: '160 mm',
      container_Load: '20GP: 2500 pcs \n 40GP: 5100 pcs \n 40HQ: 6100 pcs',
    },

    // 推荐部分
    isPopular: true,
    profitMargin: 'low',
  },

  // JX-15ZP-2
  {
    id: 'jx-15ZP-2',
    name: 'JX-15ZP-2',

    // 用于 Products 页分类
    category: 'utility-trolley',

    // 业务字段
    moq: 1000,

    variants: [
      {
        key: 'black',
        label: 'Black',
        images: [
          '/images/JX_15ZP_2/black/1.jpg',
          '/images/JX_15ZP_2/black/2.jpg',
          '/images/JX_15ZP_2/black/3.jpg',
          '/images/JX_15ZP_2/black/4.jpg',
          '/images/JX_15ZP_2/black/5.jpg',
          '/images/JX_15ZP_2/black/6.jpg',
          '/images/JX_15ZP_2/black/7.jpg',
          '/images/JX_15ZP_2/black/8.jpg',
          '/images/JX_15ZP_2/black/9.jpg',
        ],
      },
    ],

    specs: {
      product_Size: '30 x 27 x 84 cm',
      folded_Size: '49 x 29 x 6.5 cm',
      carton_Size: '50 x 30 x 54.5 cm',
      pcsPer_Carton: 16,
      net_Weight: '21.5 kg',
      gross_Weight: '23 kg',
      wheel_Size: '65 mm',
      container_Load: '20GP: 4080 pcs \n 40GP: 8400 pcs \n 40HQ: 9960 pcs',
    },

    // 推荐部分
    isPopular: true,
    profitMargin: 'low'
  },

  // JX-80SP
  {
    id: 'jx-80SP',
    name: 'JX-80SP',

    // 用于 Products 页分类
    category: 'utility-trolley',

    // 业务字段
    moq: 1000,

    variants: [
      {
        key: 'silver_gray',
        label: 'Silver Gray',
        images: [
          '/images/JX_80SP/silver_gray/1.JPG',
          '/images/JX_80SP/silver_gray/2.JPG',
          '/images/JX_80SP/silver_gray/3.JPG',
          '/images/JX_80SP/silver_gray/4.JPG',
          '/images/JX_80SP/silver_gray/5.JPG',
          '/images/JX_80SP/silver_gray/6.JPG',
          '/images/JX_80SP/silver_gray/7.JPG',
          '/images/JX_80SP/silver_gray/8.JPG',
          '/images/JX_80SP/silver_gray/9.JPG',
          '/images/JX_80SP/silver_gray/10.JPG',
        ],
      },
    ],

    specs: {
      product_Size: '42 x 39 x 109 cm',
      folded_Size: '72 x 39 x 20 cm',
      carton_Size: '73 x 16.5 x 41 cm',
      pcsPer_Carton: 2,
      net_Weight: '10.4 kg',
      gross_Weight: '11.4 kg',
      wheel_Size: '140 mm',
      container_Load: '20GP: 1120 pcs \n 40GP: 2320 pcs \n 40HQ: 2600 pcs',
    },

    // 推荐部分
    isPopular: true,
    profitMargin: 'medium',

  },

  // JX-55ZP
  {
    id: 'jx-55ZP',
    name: 'JX-55ZP',

    // 用于 Products 页分类
    category: 'utility-trolley',

    // 业务字段
    moq: 1000,

    variants: [
      {
        key: 'black',
        label: 'Black',
        images: [
          '/images/JX_55ZP/black/1.JPG',
          '/images/JX_55ZP/black/2.JPG',
          '/images/JX_55ZP/black/3.JPG',
          '/images/JX_55ZP/black/4.JPG',
          '/images/JX_55ZP/black/5.JPG',
          '/images/JX_55ZP/black/6.JPG',
          '/images/JX_55ZP/black/7.JPG',
        ],
      },
    ],

    specs: {
      product_Size: '46 x 34 x 98 cm',
      folded_Size: '59 x 34 x 14.5 cm',
      carton_Size: '59.5 x 35 x 56.5 cm',
      pcsPer_Carton: 8,
      net_Weight: '18 kg',
      gross_Weight: '19.5 kg',
      wheel_Size: '140 mm',
      container_Load: '20GP: 1840 pcs \n 40GP: 3920 pcs \n 40HQ: 4560 pcs',
    },

    // 推荐部分
    isPopular: true,
    profitMargin: 'medium',
  }
]

export default products