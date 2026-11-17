'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "60b6248600b7cd2f0b06297637ccb78a",
"version.json": "0c482aa0cc7c6f135b40f0c8ff7dc313",
"index.html": "fd08a51d9c9d36de1332a05d9c56ddfd",
"/": "fd08a51d9c9d36de1332a05d9c56ddfd",
"main.dart.js": "b42c38d5a1769fb0b2151fec3a5becc3",
"flutter.js": "f393d3c16b631f36852323de8e583132",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "ab609a0d0a3ce5d8adcc75546d6fe48f",
"assets/AssetManifest.json": "31799290cbd1472a2c249ad3470fa1fb",
"assets/NOTICES": "151b0bacf84aaf6bbb1b0550962540f9",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/AssetManifest.bin.json": "e7f0a2ef81d0f8d10c5c6106490b2ade",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "e986ebe42ef785b27164c36a9abc7818",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "65fb906cf4260241a5f89fcab9d56ab1",
"assets/fonts/MaterialIcons-Regular.otf": "fbe015a4b3cc0416f07548d00387497e",
"assets/assets/components/images/Rel%25C3%25A9_de_fases_208-440V_mini.png": "046f2c20e228e9cfd7450625799f4a94",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_2NO_-_Guardamotor.png": "a10b9ad9d2f6c7d00e12510a477a5996",
"assets/assets/components/images/Borne_PE_mini.png": "011bf66c5d65c7992e3c92d1b0835c1b",
"assets/assets/components/images/ITM_1P_mini.png": "5041259deeb5a6063b2f9f1cab19f7cb",
"assets/assets/components/images/Interruptor_horario_programable.png": "8d9b66722cd3203d498e99730c1d0e6b",
"assets/assets/components/images/Borne_gris_mini.png": "151f6eb707673862cc34c3c39bf2e015",
"assets/assets/components/images/Interruptor_de_nivel_-_Flotador.png": "5f168689c1506f95d2926103253e7f74",
"assets/assets/components/images/Resistor_mini.png": "0f0ba20c4d740bc591e99ff19f29bfe6",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_1NO_+_3NC_-_Contactor_mini.png": "e6c5be4f40dd95b62fe2117711da6139",
"assets/assets/components/images/Motor_12_terminales_mini.png": "d37fad5f86bdde32e06bdb6972b3c734",
"assets/assets/components/images/Borne_+_-_mini.png": "5f80f76b05b787d62999e0c3070c817c",
"assets/assets/components/images/Borne_verde.png": "f838e87b8cab263b5c19f10fe5f9b467",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_1NO_plus_3NC_-_Contactor.png": "e6c5be4f40dd95b62fe2117711da6139",
"assets/assets/components/images/Foco_LED.png": "4d8cf0dd92ac54b25d12eb84d26da54c",
"assets/assets/components/images/Bloque_Auxiliar_Lateral_2NC_-_Guardamotor.png": "5ef212976aab7b8c3356a065e579f0fd",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_B_mini.png": "e23369882aa8e1dea358dd95b5fd29b8",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_C_mini.png": "ea8dbc5046354d9aeabd843237cb7882",
"assets/assets/components/images/ITM_4P.png": "f4d34aa6b2de32069bc7f83486975634",
"assets/assets/components/images/Borne_negro.png": "0736069c3f10f1fe007974a7ba22a14e",
"assets/assets/components/images/Interuptor_cruzado_4_vias.png": "12764effa513ca0eb13ee955d2aa72f5",
"assets/assets/components/images/Foco_incandescente_100W_220V_mini.png": "4d8cf0dd92ac54b25d12eb84d26da54c",
"assets/assets/components/images/Rel%25C3%25A9_encapsulado_de_11_pines_mini.png": "60e9704c87d7b99fcd1b56991ed805d7",
"assets/assets/components/images/Interruptor_de_conmutacion_doble_mini.png": "c487741afc2c794446bcfc4122959423",
"assets/assets/components/images/LOGO!_AM2_AQ.png": "6805b9c9957f4171be7d3f8c16c83a37",
"assets/assets/components/images/Selector_de_2_posiciones.png": "48f1850b2c7bb9782ecfd486de6dcf38",
"assets/assets/components/images/4P-Riel_DIN_35_mm_mini.png": "1df01b65ce0154cfda7498ed8263705e",
"assets/assets/components/images/Motor_9_terminales_mini.png": "e62281ee59ecfaf229a4644c501807e6",
"assets/assets/components/images/Pulsador_verde.png": "eb91b0f3775c01a64ac8224901c0b1e4",
"assets/assets/components/images/Selector_de_3_posiciones.png": "61b9a393979368857e260c1e94f24b4a",
"assets/assets/components/images/Borne_azul.png": "d4cc15b8a5502cbd5638cac6739b75ad",
"assets/assets/components/images/Resistor.png": "0f0ba20c4d740bc591e99ff19f29bfe6",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_4NO_-_Contactor.png": "158d3bcef06d788633f81c2cbc856c16",
"assets/assets/components/images/Bornes_L1-L2-L3-N.png": "f8f3cfd56d849cfb3d5c697d94f103a0",
"assets/assets/components/images/Delta_VFD-EL-W_43W_mini.png": "dfeae327d3d6cbec777b8421bb908d2f",
"assets/assets/components/images/20P-Riel_DIN_35_mm.png": "3cd61329008f534db09983d20e408eda",
"assets/assets/components/images/Bornes_L1-L2-L3_mini.png": "47a3e29b536709959225d2ae5737bbe9",
"assets/assets/components/images/20P-Riel_DIN_35_mm_mini.png": "3cd61329008f534db09983d20e408eda",
"assets/assets/components/images/Contactor_3P_11.png": "b01a525c24d3328e6d237e2d54652e5f",
"assets/assets/components/images/Fotocelda_crepuscular_mini.png": "991c9f5468a5b14495b36f842a56c17c",
"assets/assets/components/images/Pulsador_DOWN_mini.png": "59d46c0d181135b4507a7cd808fcf351",
"assets/assets/components/images/Borne_negro_mini.png": "0736069c3f10f1fe007974a7ba22a14e",
"assets/assets/components/images/Temporizador_retardo_a_la_conexi%25C3%25B3n_1_-_30s_mini.png": "b74dee2cc666a544c67a1616c80212cc",
"assets/assets/components/images/Borne_verde_mini.png": "f838e87b8cab263b5c19f10fe5f9b467",
"assets/assets/components/images/Motor_monofasico.png": "de4f56e1d9df641c858425c7d2af88f5",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_D_mini.png": "aa50c7897f30f43cabfd602d9ad3446c",
"assets/assets/components/images/Delta_VFD-EL-W_21W.png": "bb8ba7cef37881287743daa5ec73454c",
"assets/assets/components/images/8P-Riel_DIN_35_mm_mini.png": "4dd8cd55c96c57ce221bf232a7f6912c",
"assets/assets/components/images/Bornes_L-N_mini.png": "544e90a083ecaa8a6e15a9ab59171004",
"assets/assets/components/images/LOGO!_AM2_AQ_mini.png": "6805b9c9957f4171be7d3f8c16c83a37",
"assets/assets/components/images/Interruptor_horario_programable_mini.png": "8d9b66722cd3203d498e99730c1d0e6b",
"assets/assets/components/images/16P-Riel_DIN_35_mm_mini.png": "3ddc07b134fcf65e534bc003d5423a1c",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_C.png": "aa26fa9f3c5cdff147a431c550f264b3",
"assets/assets/components/images/Transformador_100-240_48VAC_50VA.png": "f84c30551dfc61bc6a8938e4175fef5f",
"assets/assets/components/images/Power_Supply_100-240VAC_24VDC_5A_mini.png": "14c6ed3c51d914b8e22df895e1270d1e",
"assets/assets/components/images/LOGO!_12-24RCE.png": "ad85b2c144119caa90fe8125f97f5118",
"assets/assets/components/images/LOGO!_9_12-24RCE.png": "978eaa2ffb69dcc9c030825b25092602",
"assets/assets/components/images/Interuptor_simple_mini.png": "ddfd8f98212bcb3c48a440591e14193e",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_2NO_+_2NC_-_Contactor_mini.png": "93646642dda47805d7927e267476879b",
"assets/assets/components/images/ITM_2P.png": "33bfb5f42c06cad7e24c44051ad6b473",
"assets/assets/components/images/Motor_6_terminales_mini.png": "de4f56e1d9df641c858425c7d2af88f5",
"assets/assets/components/images/Modulo_de_seguridad_de_dos_canales_(XPS-AF).png": "89450655f1afb215cf02b535b6c32a5d",
"assets/assets/components/images/12P-Riel_DIN_35_mm_mini.png": "8532ced27e1e907edd377977dc9e5a3a",
"assets/assets/components/images/Power_Supply_100-240VAC_48VDC_5A_mini.png": "39cf5925f5479f82b9515846462a78af",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_4NC_-_Contactor_mini.png": "8514a3b90997f0ae946fd9cb224a4b73",
"assets/assets/components/images/Tomacorriente_doble_+_PE_mini.png": "62d6fe1bdd2c5e6b913e6161f440a225",
"assets/assets/components/images/Motor_9_terminales.png": "e62281ee59ecfaf229a4644c501807e6",
"assets/assets/components/images/Transformador_100-240_24VAC_50VA.png": "6224df7e4f75ad6703886584db367930",
"assets/assets/components/images/Seccionador_2P.png": "e972823c77ab23da3c8cbf56b1a9fccc",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_B.png": "072971566f24f7300727df58afe17ac7",
"assets/assets/components/images/Motor_6_terminales.png": "de4f56e1d9df641c858425c7d2af88f5",
"assets/assets/components/images/Sensor_de_proximidad_inductivo_2_hilos_AC-DC.png": "fdba72f6f41da6eada7f1db24ce20f59",
"assets/assets/components/images/Piloto_LED.png": "3a8fff91f299f9825f3c677198487c0c",
"assets/assets/components/images/Borne_rojo.png": "ed36415c28b89ba2b229636f65fad620",
"assets/assets/components/images/Piloto_LED_mini.png": "3a8fff91f299f9825f3c677198487c0c",
"assets/assets/components/images/LOGO!_9_230RCE_mini.png": "34ebb50e9d33c50b4198121fab8b5ec5",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_D.png": "bddce2c1144a2552fcf5580e778a33ee",
"assets/assets/components/images/LOGO!_230RCE_mini.png": "8ccb687142d19914b33d0db3cbc5d5c7",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_C_mini.png": "aa26fa9f3c5cdff147a431c550f264b3",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_B_mini.png": "072971566f24f7300727df58afe17ac7",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_1NO+1NC_-_Guardamotor_mini.png": "dc2b619ef86032cba148e0cd067e648f",
"assets/assets/components/images/Tomacorriente_doble_plus_PE.png": "62d6fe1bdd2c5e6b913e6161f440a225",
"assets/assets/components/images/LOGO!_POWER_24V_mini.png": "0db16ccdbad4353db83ddc7623159528",
"assets/assets/components/images/Seccionador_1P_mini.png": "5c256f50d27541098d198f6ac8960691",
"assets/assets/components/images/Bornes_L-N.png": "544e90a083ecaa8a6e15a9ab59171004",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_A.png": "7681e5315a4e181595ee003bcc6b0e68",
"assets/assets/components/images/Bornes_N-L.png": "a42bff90f60dd0ac030e16e407cfd56d",
"assets/assets/components/images/Modulo_de_seguridad_(XPS-AC).png": "78b22950086a97b7e5910bd87ad4c4cd",
"assets/assets/components/images/Interruptor_de_conmutacion_doble.png": "c487741afc2c794446bcfc4122959423",
"assets/assets/components/images/Guardamotor_mini.png": "065caed289aefff4114c57812c35dcbd",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_A.png": "c0968a115b3e846bbf666d2dfc5df0a4",
"assets/assets/components/images/Pulsador_piloto.png": "15d0ac88315ccd4f617ba543672fda8d",
"assets/assets/components/images/Bornes_N-L1-L2-L3_mini.png": "a225c7f4fe22800e907999c2692a0021",
"assets/assets/components/images/LOGO!_AM4_AIAQ_mini.png": "c60e0b3fa97738ae92698a127caa666d",
"assets/assets/components/images/Rel%25C3%25A9_de_fases_208-440V.png": "046f2c20e228e9cfd7450625799f4a94",
"assets/assets/components/images/Plunger_limit_switch_COM_mini.png": "c4dc2154bdedec99c9de4d66fe065db1",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_D.png": "aa50c7897f30f43cabfd602d9ad3446c",
"assets/assets/components/images/Seccionador_3P.png": "16a9510357300665fb6b7fcadcba9a46",
"assets/assets/components/images/S7-1200_CPU_1212C_AC-DC-RLY_mini.png": "4d0addcb12afc8998b248d9692bbdca2",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_B.png": "e23369882aa8e1dea358dd95b5fd29b8",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_D_mini.png": "bddce2c1144a2552fcf5580e778a33ee",
"assets/assets/components/images/Parada_de_emergencia.png": "aebe556d69673f690195fef0f145ff52",
"assets/assets/components/images/Plunger_limit_switch_1NO+1NC_mini.png": "1dfd32d8875dcc38eb8411d8e3a7d39e",
"assets/assets/components/images/Foco_incandescente_60W_220V.png": "4d8cf0dd92ac54b25d12eb84d26da54c",
"assets/assets/components/images/ITM_3P.png": "5051ac67100711e632780d7e994d9fda",
"assets/assets/components/images/Sensor_de_proximidad_inductivo_2_hilos_AC-DC_mini.png": "fdba72f6f41da6eada7f1db24ce20f59",
"assets/assets/components/images/Delta_VFD-EL-W_21W_mini.png": "bb8ba7cef37881287743daa5ec73454c",
"assets/assets/components/images/Transformador_100-240_24VAC_50VA_mini.png": "6224df7e4f75ad6703886584db367930",
"assets/assets/components/images/LOGO!_9_230RCE.png": "34ebb50e9d33c50b4198121fab8b5ec5",
"assets/assets/components/images/Rele_de_seguridad_(PNOZ_X3).png": "3c6494134305181c80f6d89a1b655da4",
"assets/assets/components/images/Foco_LED_mini.png": "4d8cf0dd92ac54b25d12eb84d26da54c",
"assets/assets/components/images/Power_Supply_100-240VAC_24VDC_5A.png": "14c6ed3c51d914b8e22df895e1270d1e",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_C.png": "ea8dbc5046354d9aeabd843237cb7882",
"assets/assets/components/images/Roller_lever_limit_switch_1NOplus1NC.png": "b488ab9efeee71b1751a1d86c8148699",
"assets/assets/components/images/Pulsador_DOWN.png": "59d46c0d181135b4507a7cd808fcf351",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_2NO_plus_2NC_-_Contactor.png": "93646642dda47805d7927e267476879b",
"assets/assets/components/images/Plunger_limit_switch_1NOplus1NC.png": "1dfd32d8875dcc38eb8411d8e3a7d39e",
"assets/assets/components/images/Temporizador_retardo_a_la_conexi%25C3%25B3n_1_-_30s.png": "b74dee2cc666a544c67a1616c80212cc",
"assets/assets/components/images/18P-Riel_DIN_35_mm_mini.png": "3e53a32bc2a62e1c5ec353a991395749",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_1NOplus1NC_-_Guardamotor.png": "dc2b619ef86032cba148e0cd067e648f",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_3NO_plus_1NC_-_Contactor.png": "954678b574d5262c4e0940842b9e50e5",
"assets/assets/components/images/Interuptor_de_conmutacion_simple.png": "1df794b5aec83bdafe43a6e7173a93b1",
"assets/assets/components/images/18P-Riel_DIN_35_mm.png": "3e53a32bc2a62e1c5ec353a991395749",
"assets/assets/components/images/Bornes_PE-L1-L2-L3-N.png": "d6b3211a51ece479ee154be61c93af1e",
"assets/assets/components/images/LOGO!_12-24RCE_mini.png": "ad85b2c144119caa90fe8125f97f5118",
"assets/assets/components/images/ITM_3P_mini.png": "5051ac67100711e632780d7e994d9fda",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_4NC_-_Contactor.png": "8514a3b90997f0ae946fd9cb224a4b73",
"assets/assets/components/images/Seccionador_2P_mini.png": "e972823c77ab23da3c8cbf56b1a9fccc",
"assets/assets/components/images/10P-Riel_DIN_35_mm_mini.png": "effbaa6dc37620831ed39867b3001071",
"assets/assets/components/images/Rel%25C3%25A9_de_seguridad_(CP-D_301).png": "f510e67a2c622764ee9b055fc608d9ff",
"assets/assets/components/images/Motor_12_terminales.png": "d37fad5f86bdde32e06bdb6972b3c734",
"assets/assets/components/images/Bloque_Auxiliar_Lateral_2NC_-_Guardamotor_mini.png": "5ef212976aab7b8c3356a065e579f0fd",
"assets/assets/components/images/Borne_plus_-.png": "5f80f76b05b787d62999e0c3070c817c",
"assets/assets/components/images/14P-Riel_DIN_35_mm_mini.png": "d1799fe13cb122d000d37b848b52ed34",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_3NO_+_1NC_-_Contactor_mini.png": "954678b574d5262c4e0940842b9e50e5",
"assets/assets/components/images/LOGO!_POWER_12V_mini.png": "42351eb912df329bb3c9da325e213aeb",
"assets/assets/components/images/Selector_de_2_posiciones_mini.png": "48f1850b2c7bb9782ecfd486de6dcf38",
"assets/assets/components/images/Plunger_limit_switch_COM.png": "c4dc2154bdedec99c9de4d66fe065db1",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_2NC_-_Guardamotor_mini.png": "560d7e20f7f983ba2f2cba540e2567c6",
"assets/assets/components/images/Barra_de_Tierra_(PE)_-_6T_A_mini.png": "c0968a115b3e846bbf666d2dfc5df0a4",
"assets/assets/components/images/S7-1200_CPU_1212C_AC-DC-RLY.png": "4d0addcb12afc8998b248d9692bbdca2",
"assets/assets/components/images/Rel%25C3%25A9_temporizado_multifunci%25C3%25B3n_RE17_mini.png": "e69d2bfe12da38e4526bcb4d77fc7635",
"assets/assets/components/images/Interuptor_simple.png": "ddfd8f98212bcb3c48a440591e14193e",
"assets/assets/components/images/Interruptor_de_nivel_-_Flotador_mini.png": "5f168689c1506f95d2926103253e7f74",
"assets/assets/components/images/SINAMICS_V20_mini.png": "3ff991da7795575cb208110ee07a2497",
"assets/assets/components/images/Pulsador_UP_mini.png": "0f026254d2c3dc90a1f1376f0816e051",
"assets/assets/components/images/Selector_de_3_posiciones_mini.png": "61b9a393979368857e260c1e94f24b4a",
"assets/assets/components/images/LOGO!_230RCE.png": "8ccb687142d19914b33d0db3cbc5d5c7",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_4NO_-_Contactor_mini.png": "158d3bcef06d788633f81c2cbc856c16",
"assets/assets/components/images/Foco_incandescente_60W_220V_mini.png": "4d8cf0dd92ac54b25d12eb84d26da54c",
"assets/assets/components/images/8P-Riel_DIN_35_mm.png": "4dd8cd55c96c57ce221bf232a7f6912c",
"assets/assets/components/images/Borne_-_+_mini.png": "1980db0ea25db807bac7354c28322b49",
"assets/assets/components/images/ID_2P.png": "e5c088919f38d540fc580b797dcea36b",
"assets/assets/components/images/ITM_1P.png": "5041259deeb5a6063b2f9f1cab19f7cb",
"assets/assets/components/images/Fotocelda_crepuscular.png": "991c9f5468a5b14495b36f842a56c17c",
"assets/assets/components/images/Pulsador_azul.png": "70422b9225ae331f1dd4fb24dbf9debf",
"assets/assets/components/images/Rel%25C3%25A9_de_seguridad_(CP-D_301)_mini.png": "f510e67a2c622764ee9b055fc608d9ff",
"assets/assets/components/images/Power_Supply_100-240VAC_12VDC_5A.png": "689069ae8d71c80b1fec799110549ac5",
"assets/assets/components/images/Sensor_Pt100_con_transmisor_mini.png": "6f1413538c1bfa5e82967b2b0793e00f",
"assets/assets/components/images/Bloque_Auxiliar_Lateral_1NO+1NC_-_Guardamotor_mini.png": "6f8cd897b050a87b24b302f1e20ada13",
"assets/assets/components/images/Transformador_100-240_12VAC_50VA_mini.png": "b864989ab8ca6550b8602d1dfa26849f",
"assets/assets/components/images/Seccionador_1P.png": "5c256f50d27541098d198f6ac8960691",
"assets/assets/components/images/Rele_termico.png": "de3c8d9804cee44cb563001c992bcfde",
"assets/assets/components/images/ID_4P_mini.png": "511f8222131644e63b402dce52b2d61f",
"assets/assets/components/images/Potenciometro_rotativo_mini.png": "a4ee198aad3780d3cfea0a8f9de8f1e3",
"assets/assets/components/images/Power_Supply_100-240VAC_12VDC_5A_mini.png": "689069ae8d71c80b1fec799110549ac5",
"assets/assets/components/images/4P-Riel_DIN_35_mm.png": "1df01b65ce0154cfda7498ed8263705e",
"assets/assets/components/images/Borne_rojo_mini.png": "ed36415c28b89ba2b229636f65fad620",
"assets/assets/components/images/Bornes_N-L_mini.png": "a42bff90f60dd0ac030e16e407cfd56d",
"assets/assets/components/images/Interuptor_doble.png": "a8ea89641530a491af44a4f093751fa5",
"assets/assets/components/images/12P-Riel_DIN_35_mm.png": "8532ced27e1e907edd377977dc9e5a3a",
"assets/assets/components/images/ITM_2P_mini.png": "33bfb5f42c06cad7e24c44051ad6b473",
"assets/assets/components/images/Rel%25C3%25A9_encapsulado_de_8_pines.png": "e002abdb2e3e21a63cbd383388008213",
"assets/assets/components/images/Borne_gris.png": "151f6eb707673862cc34c3c39bf2e015",
"assets/assets/components/images/Transformador_100-240_12VAC_50VA.png": "b864989ab8ca6550b8602d1dfa26849f",
"assets/assets/components/images/Rel%25C3%25A9_temporizado_multifunci%25C3%25B3n_RE17.png": "e69d2bfe12da38e4526bcb4d77fc7635",
"assets/assets/components/images/Pulsador_rojo.png": "63a989d3b957cbb719f948d672ea14bf",
"assets/assets/components/images/Guardamotor.png": "065caed289aefff4114c57812c35dcbd",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_2NO_-_Guardamotor_mini.png": "a10b9ad9d2f6c7d00e12510a477a5996",
"assets/assets/components/images/Temporizador_retardo_a_la_desconexi%25C3%25B3n_1_-_30s.png": "17b77874c761469ade9b818fb6d07d12",
"assets/assets/components/images/Borne_-_plus.png": "1980db0ea25db807bac7354c28322b49",
"assets/assets/components/images/10P-Riel_DIN_35_mm.png": "effbaa6dc37620831ed39867b3001071",
"assets/assets/components/images/Motor_monofasico_mini.png": "de4f56e1d9df641c858425c7d2af88f5",
"assets/assets/components/images/6P-Riel_DIN_35_mm.png": "1251fb4b8218dc32547b0cf9f2f038ae",
"assets/assets/components/images/Borne_PE.png": "011bf66c5d65c7992e3c92d1b0835c1b",
"assets/assets/components/images/Roller_lever_limit_switch_COM.png": "c2a0f81a96781e0073fd1b942f3a94a9",
"assets/assets/components/images/Seccionador_3P_mini.png": "16a9510357300665fb6b7fcadcba9a46",
"assets/assets/components/images/Pulsador_rojo_mini.png": "63a989d3b957cbb719f948d672ea14bf",
"assets/assets/components/images/Bornes_L1-L2-L3-N_mini.png": "f8f3cfd56d849cfb3d5c697d94f103a0",
"assets/assets/components/images/LOGO!_9_12-24RCE_mini.png": "978eaa2ffb69dcc9c030825b25092602",
"assets/assets/components/images/Delta_VFD-EL-W_43W.png": "dfeae327d3d6cbec777b8421bb908d2f",
"assets/assets/components/images/Rel%25C3%25A9_encapsulado_de_8_pines_mini.png": "e002abdb2e3e21a63cbd383388008213",
"assets/assets/components/images/ITM_4P_mini.png": "f4d34aa6b2de32069bc7f83486975634",
"assets/assets/components/images/Foco_incandescente_100W_220V.png": "4d8cf0dd92ac54b25d12eb84d26da54c",
"assets/assets/components/images/Barra_de_Neutro_(N)_-_6T_A_mini.png": "7681e5315a4e181595ee003bcc6b0e68",
"assets/assets/components/images/Rel%25C3%25A9_encapsulado_de_11_pines.png": "60e9704c87d7b99fcd1b56991ed805d7",
"assets/assets/components/images/Interuptor_cruzado_4_vias_mini.png": "12764effa513ca0eb13ee955d2aa72f5",
"assets/assets/components/images/Bloque_Auxiliar_Frontal_2NC_-_Guardamotor.png": "560d7e20f7f983ba2f2cba540e2567c6",
"assets/assets/components/images/ID_4P.png": "511f8222131644e63b402dce52b2d61f",
"assets/assets/components/images/Rele_termico_mini.png": "de3c8d9804cee44cb563001c992bcfde",
"assets/assets/components/images/SINAMICS_V20.png": "3ff991da7795575cb208110ee07a2497",
"assets/assets/components/images/Roller_lever_limit_switch_1NO+1NC_mini.png": "b488ab9efeee71b1751a1d86c8148699",
"assets/assets/components/images/Sensor_de_proximidad_inductivo_3_hilos_DC.png": "bdd640198633183644e3c7731f857b62",
"assets/assets/components/images/Bornes_PE-L1-L2-L3-N_mini.png": "d6b3211a51ece479ee154be61c93af1e",
"assets/assets/components/images/Sensor_de_proximidad_inductivo_3_hilos_DC_mini.png": "bdd640198633183644e3c7731f857b62",
"assets/assets/components/images/Bornes_N-L1-L2-L3.png": "a225c7f4fe22800e907999c2692a0021",
"assets/assets/components/images/Parada_de_emergencia_mini.png": "aebe556d69673f690195fef0f145ff52",
"assets/assets/components/images/16P-Riel_DIN_35_mm.png": "3ddc07b134fcf65e534bc003d5423a1c",
"assets/assets/components/images/ID_2P_mini.png": "e5c088919f38d540fc580b797dcea36b",
"assets/assets/components/images/LOGO!_POWER_12V.png": "42351eb912df329bb3c9da325e213aeb",
"assets/assets/components/images/Roller_lever_limit_switch_COM_mini.png": "c2a0f81a96781e0073fd1b942f3a94a9",
"assets/assets/components/images/Pulsador_piloto_mini.png": "15d0ac88315ccd4f617ba543672fda8d",
"assets/assets/components/images/Contactor_3P_11_mini.png": "b01a525c24d3328e6d237e2d54652e5f",
"assets/assets/components/images/Borne_azul_mini.png": "d4cc15b8a5502cbd5638cac6739b75ad",
"assets/assets/components/images/Bloque_Auxiliar_Lateral_2NO_-_Guardamotor_mini.png": "73e37d54ee79cd21a769826982bab66a",
"assets/assets/components/images/Interuptor_doble_mini.png": "a8ea89641530a491af44a4f093751fa5",
"assets/assets/components/images/Modulo_de_seguridad_(XPS-AC)_mini.png": "78b22950086a97b7e5910bd87ad4c4cd",
"assets/assets/components/images/Sensor_Pt100_con_transmisor.png": "6f1413538c1bfa5e82967b2b0793e00f",
"assets/assets/components/images/Bloque_Auxiliar_Lateral_1NOplus1NC_-_Guardamotor.png": "6f8cd897b050a87b24b302f1e20ada13",
"assets/assets/components/images/Rele_de_seguridad_(PNOZ_X3)_mini.png": "3c6494134305181c80f6d89a1b655da4",
"assets/assets/components/images/Pulsador_verde_mini.png": "eb91b0f3775c01a64ac8224901c0b1e4",
"assets/assets/components/images/Modulo_de_seguridad_de_dos_canales_(XPS-AF)_mini.png": "89450655f1afb215cf02b535b6c32a5d",
"assets/assets/components/images/Bloque_Auxiliar_Lateral_2NO_-_Guardamotor.png": "73e37d54ee79cd21a769826982bab66a",
"assets/assets/components/images/Transformador_100-240_48VAC_50VA_mini.png": "f84c30551dfc61bc6a8938e4175fef5f",
"assets/assets/components/images/LOGO!_AM4_AIAQ.png": "c60e0b3fa97738ae92698a127caa666d",
"assets/assets/components/images/LOGO!_POWER_24V.png": "0db16ccdbad4353db83ddc7623159528",
"assets/assets/components/images/Power_Supply_100-240VAC_48VDC_5A.png": "39cf5925f5479f82b9515846462a78af",
"assets/assets/components/images/Temporizador_retardo_a_la_desconexi%25C3%25B3n_1_-_30s_mini.png": "17b77874c761469ade9b818fb6d07d12",
"assets/assets/components/images/Pulsador_UP.png": "0f026254d2c3dc90a1f1376f0816e051",
"assets/assets/components/images/Potenciometro_rotativo.png": "a4ee198aad3780d3cfea0a8f9de8f1e3",
"assets/assets/components/images/14P-Riel_DIN_35_mm.png": "d1799fe13cb122d000d37b848b52ed34",
"assets/assets/components/images/6P-Riel_DIN_35_mm_mini.png": "1251fb4b8218dc32547b0cf9f2f038ae",
"assets/assets/components/images/Bornes_L1-L2-L3.png": "47a3e29b536709959225d2ae5737bbe9",
"assets/assets/components/images/Pulsador_azul_mini.png": "70422b9225ae331f1dd4fb24dbf9debf",
"assets/assets/components/images/Interuptor_de_conmutacion_simple_mini.png": "1df794b5aec83bdafe43a6e7173a93b1",
"assets/assets/components/catalog_all.json": "cf1c9048b475709c5dfe41e773106826",
"canvaskit/skwasm.js": "694fda5704053957c2594de355805228",
"canvaskit/skwasm.js.symbols": "262f4827a1317abb59d71d6c587a93e2",
"canvaskit/canvaskit.js.symbols": "48c83a2ce573d9692e8d970e288d75f7",
"canvaskit/skwasm.wasm": "9f0c0c02b82a910d12ce0543ec130e60",
"canvaskit/chromium/canvaskit.js.symbols": "a012ed99ccba193cf96bb2643003f6fc",
"canvaskit/chromium/canvaskit.js": "671c6b4f8fcc199dcc551c7bb125f239",
"canvaskit/chromium/canvaskit.wasm": "b1ac05b29c127d86df4bcfbf50dd902a",
"canvaskit/canvaskit.js": "66177750aff65a66cb07bb44b8c6422b",
"canvaskit/canvaskit.wasm": "1f237a213d7370cf95f443d896176460",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c"};
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
