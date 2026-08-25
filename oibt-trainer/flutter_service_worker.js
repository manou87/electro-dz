'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "ffe7c71b7d2d15ae8f153800e33dba09",
"version.json": "c821e1e74987c0ffab317051fc31d7ff",
"index.html": "96e676bee82e2f9aacd8c7004506c481",
"/": "96e676bee82e2f9aacd8c7004506c481",
"main.dart.js": "7a169a984bb17c14e6afe62da4f32610",
"flutter.js": "76f08d47ff9f5715220992f993002504",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "4f2fc723911a5c98433455bfbc991de4",
"assets/AssetManifest.json": "21a356c56ca3c28a9aa08daf6fed9122",
"assets/NOTICES": "ad9b50dacd36d0690a3490c4afd79865",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/AssetManifest.bin.json": "bec7a270e5318702ec51c5adaa69c032",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "6532764ac0996345e4049f9aaf8ff862",
"assets/fonts/MaterialIcons-Regular.otf": "e790e6e5823718fc1d9f54e8e968f829",
"assets/assets/branding/swissdz_icon.png": "02c998cf5f7aea8dab8d9d42e10b4114",
"assets/assets/scenarios/scenario_01_conforme.json": "d7f493ae85ac10d70392b21467cecf28",
"assets/assets/scenarios/scenario_02_isolement_defaut.json": "7d6fb8ce609e1b8e6ec8cd99b099e286",
"assets/assets/scenarios/scenario_03_rcd_lent.json": "1e2494545e797f51a3a204398f81b5ee",
"assets/assets/cables/prise_cee_r1.png": "43da67cd4a26cd51594400c44d8f56d3",
"assets/assets/cables/cable_PE.png": "b98480ee674ac0ebd8428fffe3e51015",
"assets/assets/cables/prise_type_j_face.png": "60623e35eaf7b2c1c801d189faedae44",
"assets/assets/cables/prise_type_j_r2.png": "0c1a6209635d5074d5e604a031ab573f",
"assets/assets/cables/cable_N.png": "28b393b51b829d2b5c236a837dc10290",
"assets/assets/cables/prise_type_j_lnpe.png": "ec108dbd0aa4a6f6b7f13c644bb39687",
"assets/assets/cables/cable_L.png": "a28e033b8ee936681be44d5ea2514b3d",
"assets/assets/cables/prise_choco_eu_face.png": "7f35254a68f3b1c6d94467aebc42d4d1",
"assets/assets/devices/fluke_1664_fc_angle.jpg": "19e5c0d4f871449be74f4f456a180538",
"assets/assets/devices/panel/rcbo_c16_30ma_off.png": "b2d6e0181a9b8e3849e92e1e198275d9",
"assets/assets/devices/panel/disjoncteur_c16_lever_off.png": "e99048bcd84c0ee4e81995e13dfb3de4",
"assets/assets/devices/panel/_full_disjoncteur_c16.png": "9ea4d0693f2ae3452293c6a2cc8ba407",
"assets/assets/devices/panel/idr_40a_2p_off.png": "46b47aa03dad7d75ac0a98907fb5ed90",
"assets/assets/devices/panel/disjoncteur_c10.png": "c564d91b42b398b88cb98dab3c6c7455",
"assets/assets/devices/panel/rcbo_c16_30ma.png": "72e91f626b41076fae6caff6e55a382a",
"assets/assets/devices/panel/disjoncteur_c10_off.png": "db42c17d06e0851832ef5b41fac7b721",
"assets/assets/devices/panel/_full_disjoncteur_c10.png": "f861007a025674f1ba5447d332427f86",
"assets/assets/devices/panel/disjoncteur_c16.png": "e444fd284878084921d4059bfba5f98f",
"assets/assets/devices/panel/_full_disjoncteur_c20.png": "f2dc0171d52b2d577cd10ebd7300bf20",
"assets/assets/devices/panel/disjoncteur_c10_lever_off.png": "38d07463b94e03c0ac99a613c374eb36",
"assets/assets/devices/panel/pe_bar_hager.png": "92a1d144febfb629598fd18e1ba43e6b",
"assets/assets/devices/panel/earth/methode_62pct.png": "addb311f2f6cfa17d6f738171893dbf8",
"assets/assets/devices/panel/idr_40a_2p.png": "18ae2b67235fbd3237465da5a276e89b",
"assets/assets/devices/panel/disjoncteur_c20.png": "196ca6250945c09ae28aab5a4568e2ea",
"assets/assets/devices/panel/disjoncteur_c20_off.png": "ae4a7e53813ced47f5178b11203639b9",
"assets/assets/devices/panel/pe_bar_hager.webp": "7d2e4cf3a744c3bec966a3a36a71249f",
"assets/assets/devices/panel/disjoncteur_c20_lever_off.png": "e99048bcd84c0ee4e81995e13dfb3de4",
"assets/assets/devices/panel/disjoncteur_c16_off.png": "5257ca6eb320161f1ef2f04d11a82bd9",
"assets/assets/devices/panel/rcbo_c16_30ma_lever_off.png": "e99048bcd84c0ee4e81995e13dfb3de4",
"assets/assets/devices/panel/idr_40a.png": "ef8371959e2e1a0d5641d862247dc1bf",
"assets/assets/devices/panel/idr_40a_2p_lever_off.png": "5dc0117208047d30b8b8b0c7039d8be8",
"assets/assets/devices/fluke_parts/preview_rot_40.jpg": "c0a9421020b9977ac1dd049a25b56944",
"assets/assets/devices/fluke_parts/_measure_f.jpg": "e4f53efb0e01d146b5d9883cf38f7796",
"assets/assets/devices/fluke_parts/fluke_front.jpg": "43fa774ce7f80c535313e44a6cd3a76e",
"assets/assets/devices/fluke_parts/hotspots.json": "1dd969a5817d37f1aeeedbc1d778c05d",
"assets/assets/devices/fluke_parts/preview_rot_80.jpg": "f7b6fe0f3e9a5dcef601619f6dcb2e20",
"assets/assets/devices/fluke_parts/verify_dial_lcd_sync.jpg": "ce7415da413f80581513fca52d7c14e5",
"assets/assets/devices/fluke_parts/knob_strip.jpg": "a666d9d35a623b930c8fa3c9770e9c2d",
"assets/assets/devices/fluke_parts/verify_rot_72.jpg": "18245b132bc061b5604c4d7511ce42ea",
"assets/assets/devices/fluke_parts/_crop_left.jpg": "6ecc22917c2d1f992d9c199d3948cda7",
"assets/assets/devices/fluke_parts/calibration_overlay_v2.jpg": "5f85dc8d26929f815f585b20bfefd97d",
"assets/assets/devices/fluke_parts/dial_frames/knob_62.png": "df7466448adea2eb5eeaefcb9472e841",
"assets/assets/devices/fluke_parts/dial_frames/knob_63.png": "b0f9ce06d193eb18631ba7cd315f6352",
"assets/assets/devices/fluke_parts/dial_frames/knob_49.png": "1abad20461e115126a10f700ed1cd231",
"assets/assets/devices/fluke_parts/dial_frames/knob_61.png": "9e6d33262992130beda0f87c120eaa40",
"assets/assets/devices/fluke_parts/dial_frames/knob_60.png": "0df7592c382504a4271bde2f372ea0de",
"assets/assets/devices/fluke_parts/dial_frames/knob_48.png": "f439906ec2efdb3b0614676be812e99a",
"assets/assets/devices/fluke_parts/dial_frames/knob_70.png": "6d56b2a6231f81a76a098a2f4db1906f",
"assets/assets/devices/fluke_parts/dial_frames/knob_64.png": "5844709333f7ffb8c9bb86bad01e9700",
"assets/assets/devices/fluke_parts/dial_frames/knob_58.png": "1eac28c5ba1c398f38c6222ba0ea8637",
"assets/assets/devices/fluke_parts/dial_frames/knob_59.png": "7a45cac0c3d6fcab127ac64b8d9d863d",
"assets/assets/devices/fluke_parts/dial_frames/knob_65.png": "98b7bfa8349b9abcb6d14b7f0c876797",
"assets/assets/devices/fluke_parts/dial_frames/knob_71.png": "6fd2367b858dfbd647883cf5a4babe19",
"assets/assets/devices/fluke_parts/dial_frames/knob_67.png": "aa1d0b05a5f5e78570b520851ddbd116",
"assets/assets/devices/fluke_parts/dial_frames/knob_66.png": "ddad140cbe517c81fb81c1a4e0fbb068",
"assets/assets/devices/fluke_parts/dial_frames/knob_29.png": "d79da364c6979e5fa67195520a66b8af",
"assets/assets/devices/fluke_parts/dial_frames/knob_01.png": "48c6f7b914cbdf0a19fadf560421db5f",
"assets/assets/devices/fluke_parts/dial_frames/knob_15.png": "3a7edb9f9954e7841cf1034851e5f706",
"assets/assets/devices/fluke_parts/dial_frames/knob_14.png": "b036733dce890667ee70ceda2fe66cca",
"assets/assets/devices/fluke_parts/dial_frames/knob_00.png": "17a2c679a792c736e0388591ab7b0bee",
"assets/assets/devices/fluke_parts/dial_frames/knob_28.png": "2c4d046c9bc300ee4b1359efec8e2cc1",
"assets/assets/devices/fluke_parts/dial_frames/knob_16.png": "2ff624fd7a7d6cfa32b6fa29f4085e6e",
"assets/assets/devices/fluke_parts/dial_frames/knob_02.png": "de9d5a65634fbaaee6c7c1bd32b4e32f",
"assets/assets/devices/fluke_parts/dial_frames/knob_03.png": "1c953a4e3205bfea9ac74cd33da46ebd",
"assets/assets/devices/fluke_parts/dial_frames/knob_17.png": "2e851d0f89ba45e53268d45cd6fcd894",
"assets/assets/devices/fluke_parts/dial_frames/knob_13.png": "be39af2fecda2c6f357dd237f353697c",
"assets/assets/devices/fluke_parts/dial_frames/knob_07.png": "9aa8f793952512ef3ec6330fac2da1f8",
"assets/assets/devices/fluke_parts/dial_frames/knob_06.png": "af75ef91981f9e2a8cc69e5c06e73ec1",
"assets/assets/devices/fluke_parts/dial_frames/knob_12.png": "830a1a7fcaaeafc77b5c26ab472fb2a2",
"assets/assets/devices/fluke_parts/dial_frames/knob_04.png": "6e4f3b951d7d4ee71cf0c52d9f27b3b2",
"assets/assets/devices/fluke_parts/dial_frames/knob_10.png": "6c3703c4fad2f5a0691a47c0623a575e",
"assets/assets/devices/fluke_parts/dial_frames/knob_38.png": "f21867c63969a243978b3210a3f15fd3",
"assets/assets/devices/fluke_parts/dial_frames/knob_39.png": "766e32ed4b98aa581b08734d26b7d09a",
"assets/assets/devices/fluke_parts/dial_frames/knob_11.png": "20e066b2789be9691eda1a1b6500781e",
"assets/assets/devices/fluke_parts/dial_frames/knob_05.png": "8fefaa5461d742209b34746aa4bbbeea",
"assets/assets/devices/fluke_parts/dial_frames/knob_08.png": "e942aeb81e93479d571ccfea9665970a",
"assets/assets/devices/fluke_parts/dial_frames/knob_20.png": "42eea123e6e2706e83858be88364a217",
"assets/assets/devices/fluke_parts/dial_frames/knob_34.png": "e8c18342d839c679fe4e15182d140f36",
"assets/assets/devices/fluke_parts/dial_frames/knob_35.png": "dd60c0827f5215571eb6eed7c0cc8c4a",
"assets/assets/devices/fluke_parts/dial_frames/knob_21.png": "3b4a6c35581252ccd5de1f229e9f30bc",
"assets/assets/devices/fluke_parts/dial_frames/knob_09.png": "d34140e9ca82c875d41406266e324792",
"assets/assets/devices/fluke_parts/dial_frames/knob_37.png": "4aa297a41db55cd752aa1aa11e339ef3",
"assets/assets/devices/fluke_parts/dial_frames/knob_23.png": "8d316eb26266fccfb7a57f5436ba0b07",
"assets/assets/devices/fluke_parts/dial_frames/knob_22.png": "2725a3c4e0a9acd1fbfa9e3bc3bb8d86",
"assets/assets/devices/fluke_parts/dial_frames/knob_36.png": "0d28a6d156e791c5bc250f05f48186a0",
"assets/assets/devices/fluke_parts/dial_frames/knob_32.png": "fbd3e444213f33de5d1a458d2f0751ce",
"assets/assets/devices/fluke_parts/dial_frames/knob_26.png": "9900febb3e6ae544047c45caffd86fdb",
"assets/assets/devices/fluke_parts/dial_frames/knob_27.png": "6f91649906892476aefdfd7bf341cf07",
"assets/assets/devices/fluke_parts/dial_frames/knob_33.png": "ee831798cc87df5065f42ff495fbd750",
"assets/assets/devices/fluke_parts/dial_frames/knob_25.png": "91f9bd6aed012490c1c181632848ac8c",
"assets/assets/devices/fluke_parts/dial_frames/knob_31.png": "f89523f118db46d897d10296aae9df94",
"assets/assets/devices/fluke_parts/dial_frames/knob_19.png": "b63dbf238f5f3b91951d85e068e1cff9",
"assets/assets/devices/fluke_parts/dial_frames/knob_18.png": "0dc0d6f1bf93d99a7de2c5b11418b8f5",
"assets/assets/devices/fluke_parts/dial_frames/knob_30.png": "296a7f566a111b7aff913dcfc49cbb4e",
"assets/assets/devices/fluke_parts/dial_frames/knob_24.png": "eaa26787d8681cce03d69a0a3e0f5c1b",
"assets/assets/devices/fluke_parts/dial_frames/knob_43.png": "7d7e0d1fa472702c10446f0203beb816",
"assets/assets/devices/fluke_parts/dial_frames/knob_57.png": "c39645d9043d638b581e27e8d685b5e4",
"assets/assets/devices/fluke_parts/dial_frames/knob_56.png": "3f4d1cf493940b6d9d0b2f8bc21063cb",
"assets/assets/devices/fluke_parts/dial_frames/knob_42.png": "69a4b8931c229e01b164662c57b2237d",
"assets/assets/devices/fluke_parts/dial_frames/knob_68.png": "396182faf6294fdf532f658d06af623d",
"assets/assets/devices/fluke_parts/dial_frames/knob_54.png": "dc406ed0accf249136bb0543c7b64877",
"assets/assets/devices/fluke_parts/dial_frames/knob_40.png": "f16d22dba92b62f3311434708d86c323",
"assets/assets/devices/fluke_parts/dial_frames/knob_41.png": "083b728a5a13579a1f75ed6fb2f81df5",
"assets/assets/devices/fluke_parts/dial_frames/knob_55.png": "8d7e5087498d3b3824f464229f68f950",
"assets/assets/devices/fluke_parts/dial_frames/knob_69.png": "a0f988b5a89bdf8d734db87c3d653e10",
"assets/assets/devices/fluke_parts/dial_frames/knob_51.png": "8ce8c526e2c3c0a81ca3eca8fefa8d0f",
"assets/assets/devices/fluke_parts/dial_frames/knob_45.png": "74c66cbd22650383481057607846b40f",
"assets/assets/devices/fluke_parts/dial_frames/knob_44.png": "c67057ba412bfe5fdb7b07a97b990eef",
"assets/assets/devices/fluke_parts/dial_frames/knob_50.png": "33623edfb16522d0f2560649e008e350",
"assets/assets/devices/fluke_parts/dial_frames/knob_46.png": "8ac7d745e493b2bc4c44a589c622d17c",
"assets/assets/devices/fluke_parts/dial_frames/knob_52.png": "8f1a4e3c05b58454a5f8e3492f401cac",
"assets/assets/devices/fluke_parts/dial_frames/knob_53.png": "e9edf2357db62569996b33afa8bbb8cb",
"assets/assets/devices/fluke_parts/dial_frames/knob_47.png": "4e258fa772a7263efb860a362a19a075",
"assets/assets/devices/fluke_parts/knob_r048.png": "1402d90eb30fd08669581f98f1cc7dd3",
"assets/assets/devices/fluke_parts/dial_detect_front.jpg": "60830daed5a524300f669432e50b0989",
"assets/assets/devices/fluke_parts/dial_knob.png": "924e8e93e146a6f47fb1027e00bdf080",
"assets/assets/devices/fluke_parts/verify_brand_lcd.jpg": "9a3742674116cc7ca07eef2aa8507c34",
"assets/assets/devices/fluke_parts/fluke_front_8pos_backup.jpg": "212492fd7416ea1e722fd18f1e41e28f",
"assets/assets/devices/fluke_parts/knob_r062.png": "ab2c84ea5a96928dda4ac78a73a3088f",
"assets/assets/devices/fluke_parts/_crop_dial.jpg": "a4d2fcf2889758baae8fe86d16c3a03a",
"assets/assets/devices/fluke_parts/verify_no_black_brand.jpg": "31570cc1a38a53f8b84c4ea423f9a266",
"assets/assets/devices/fluke_parts/_knob_clean.png": "17a2c679a792c736e0388591ab7b0bee",
"assets/assets/devices/fluke_parts/_knob_r115.png": "51d69d8a3818182c2ab10f74c0ae3695",
"assets/assets/devices/fluke_parts/%255C_raw_top.jpg": "2a307362c450afc2db995336e292be50",
"assets/assets/devices/fluke_parts/hotspots_generated.dart.txt": "1cd4a93c6419c2930b51977818acd76b",
"assets/assets/devices/fluke_parts/_crop_bottom.jpg": "e2d6e3c63792e3e5e095197ebf011d49",
"assets/assets/devices/fluke_parts/dial_meta.json": "9ed4decb2b9d82d370511a5b0884ea44",
"assets/assets/devices/fluke_parts/verify_labels_static.jpg": "df1f32b6b0a836f4a2cd0b45a65ae963",
"assets/assets/devices/fluke_parts/preview_pos_8.jpg": "58efb828ebd75d8b439faebf08c880ac",
"assets/assets/devices/fluke_parts/calibration_overlay.jpg": "3af7893d3ce8f6fd9805a176175075cb",
"assets/assets/devices/fluke_parts/fluke_base_no_knob.jpg": "63c9e203305b149f239bf1ec9f971e9d",
"assets/assets/devices/fluke_parts/verify_lcd_fit.jpg": "dad9d17038f017bc7ca2693b78b492ac",
"assets/assets/devices/fluke_parts/_knob_r135.png": "f39e58a04f9afcb983baa78885e4d323",
"assets/assets/devices/fluke_parts/preview_pos_5.jpg": "f868709ee59cf5aa568781660971b211",
"assets/assets/devices/fluke_parts/verify_dial_lcd_sync_crop.jpg": "446ffed5bec68231901d68658a24ccb0",
"assets/assets/devices/fluke_parts/_verify_f.jpg": "9ecfc179ee99f2ba8c299167de4e0ad2",
"assets/assets/devices/fluke_parts/_verify_f2.jpg": "b4e4bbb6330ea4a814b1fcba01160f07",
"assets/assets/devices/fluke_parts/dial_detect.jpg": "e80ab6bfc667b62925bc749e9b87849e",
"assets/assets/devices/fluke_parts/verify_rot_0.jpg": "14f33408a640bdd279b9f6eeadf6fc5a",
"assets/assets/devices/fluke_parts/_crop_top.jpg": "3804958ee545d7e17dac05bcacd31a9c",
"assets/assets/devices/fluke_parts/preview_rot_0.jpg": "78501fae6dcfa6b48355146307729bcc",
"assets/assets/devices/fluke_parts/_measure_lcd.jpg": "4044be9488315cfcb05c12e194af4387",
"assets/assets/devices/fluke_parts/preview_pos_3.jpg": "fa7afe09a126328ba8004010d7e89061",
"assets/assets/devices/fluke_parts/verify_rot_144.jpg": "60aa814d1bffe328ecd3955359bd91d3",
"assets/assets/devices/fluke_parts/preview_pos_2.jpg": "7902b520b121f9e49235040810b23226",
"assets/assets/devices/fluke_parts/preview_pos_0.jpg": "5dec760ca56cd81eab9ff1e5279a2b4c",
"assets/assets/devices/fluke_parts/_verify_dial.jpg": "d84b2fa8dfba7bc73718f33b34325508",
"assets/assets/devices/fluke_parts/preview_pos_1.jpg": "d575ac3e1ebcb0cc041bddae453a4e70",
"assets/assets/devices/fluke_parts/_knob_r125.png": "d17d6935118477eb30405279fb33f7c6",
"assets/assets/devices/fluke_parts/_measure_dial.jpg": "6ea83cee71c6a4dd9864a1ed3cf7ec3b",
"assets/assets/devices/fluke_parts/verify_brand_only.jpg": "bad53898bc711167bf6ec871b386094b",
"assets/assets/devices/fluke_parts/fluke_base_no_knob_8pos_backup.jpg": "3f9f3ecbcaa173b399909161e3f7acd2",
"assets/assets/devices/fluke_parts/preview_rot_120.jpg": "8a8b4f2f995c41dd1e30c2d918f1608c",
"assets/assets/devices/fluke_parts/knob_r055.png": "2e09b5e21d0ea90f7ae6d5db955cf472",
"assets/assets/devices/fluke_parts/knob_r068.png": "1574228f723a4f1e1cfdbc06fc2313b7",
"assets/assets/devices/fluke_parts/_crop_lcd.jpg": "5c56bf7c1c68a0069533f0210d88b25c",
"assets/assets/devices/fluke_parts/_knob_r145.png": "298d28807b98a5b5c2f1b6ae3694b6b1",
"assets/assets/devices/refs/ca_6117_hotspots.json": "458196c5fe106827360d151c78911298",
"assets/assets/devices/refs/amprobe_proinstall_75_hotspots.json": "49e5c7afb72899633c2596af797b5ff2",
"assets/assets/devices/refs/metrel_mi_3155_meta.json": "b99a8e826a5338ff31cd58655c4bb08d",
"assets/assets/devices/refs/megger_mft_x1.jpg": "29d0ca22b07ed4dd430d29888a430999",
"assets/assets/devices/refs/megger_mft1741_meta.json": "809024f4d3cd6750144133c427938c96",
"assets/assets/devices/refs/amprobe_proinstall_75_meta.json": "10f8ee3a0e4d7b67cee5962ed4e5284a",
"assets/assets/devices/refs/megger_mft_x1_hotspots.json": "5d28717a25749741d3a380dba87e16ae",
"assets/assets/devices/refs/megger_mft_x1_meta.json": "6095cb4bc51be83614e47119647cf813",
"assets/assets/devices/refs/megger_mft1741_hotspots.json": "800853259b19f615a5668e71a894c3cb",
"assets/assets/devices/refs/metrel_mi_3155_hotspots.json": "7d1c5467a471a895f97c205185e595a8",
"assets/assets/devices/refs/ca_6117_meta.json": "f642227a543c520d233e5e15b4378adb",
"assets/assets/devices/refs/amprobe_proinstall_75.jpg": "5c29b474846a0483c4dfe64ba36aadc9",
"assets/assets/devices/refs/megger_mft1741.jpg": "cab5d93d0b38ac01bf9d3f21a6efc622",
"assets/assets/devices/refs/ca_6117.jpg": "49b70a91ce56f862bbb7bbca68d29770",
"assets/assets/devices/refs/metrel_mi_3155.jpg": "1d75a3ac3b1e2ec7ed5c28f3fa409408",
"assets/assets/devices/fluke_1664_fc_front.jpg": "6a8a9d265a89858d6e582839336ed97f",
"assets/assets/devices/fluke_1664_fc_front_ortho_ai.png": "ddcced7a9a58eed2ebe8861d13ea7b85",
"assets/assets/devices/fluke_1664_fc_alt.jpg": "5bede43d867ba4f076afedf1d8e9673c",
"assets/assets/devices/fluke_1664_fc_front_real.jpg": "cd7f1d55f9e33edbab568f12418614c1",
"canvaskit/skwasm_st.js": "d1326ceef381ad382ab492ba5d96f04d",
"canvaskit/skwasm.js": "f2ad9363618c5f62e813740099a80e63",
"canvaskit/skwasm.js.symbols": "80806576fa1056b43dd6d0b445b4b6f7",
"canvaskit/canvaskit.js.symbols": "68eb703b9a609baef8ee0e413b442f33",
"canvaskit/skwasm.wasm": "f0dfd99007f989368db17c9abeed5a49",
"canvaskit/chromium/canvaskit.js.symbols": "5a23598a2a8efd18ec3b60de5d28af8f",
"canvaskit/chromium/canvaskit.js": "34beda9f39eb7d992d46125ca868dc61",
"canvaskit/chromium/canvaskit.wasm": "64a386c87532ae52ae041d18a32a3635",
"canvaskit/skwasm_st.js.symbols": "c7e7aac7cd8b612defd62b43e3050bdd",
"canvaskit/canvaskit.js": "86e461cf471c1640fd2b461ece4589df",
"canvaskit/canvaskit.wasm": "efeeba7dcc952dae57870d4df3111fad",
"canvaskit/skwasm_st.wasm": "56c3973560dfcbf28ce47cebe40f3206"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
