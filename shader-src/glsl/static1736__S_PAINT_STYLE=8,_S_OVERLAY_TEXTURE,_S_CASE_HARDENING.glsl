// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 12 (name: g_vColor1) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (24252 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=8, S_OVERLAY_TEXTURE, S_CASE_HARDENING

#version 460
#if defined(GL_EXT_control_flow_attributes)
#extension GL_EXT_control_flow_attributes : require
#define SPIRV_CROSS_FLATTEN [[flatten]]
#define SPIRV_CROSS_BRANCH [[dont_flatten]]
#define SPIRV_CROSS_UNROLL [[unroll]]
#define SPIRV_CROSS_LOOP [[dont_unroll]]
#else
#define SPIRV_CROSS_FLATTEN
#define SPIRV_CROSS_BRANCH
#define SPIRV_CROSS_UNROLL
#define SPIRV_CROSS_LOOP
#endif

vec4 _2;

struct _1460
{
    int bRoughnessMode;
    vec3 g_vAlbedoLevels;
    float g_fColorBoostFactor;
    float g_fOverlayStrength;
    float g_fOverlayMaterialStrength;
    float g_fOverlayBrightness;
    float g_fOverlayDurability;
    float g_fOverlayRoughness;
    float g_fOverlayMetalness;
    float g_fOverlayPearlescentMask;
    float g_fWearSoftness;
    vec3 g_vColor0;
    vec3 g_vColor1;
    vec3 g_vColor2;
    vec3 g_vColor3;
    float g_flColorBrightness;
    int g_nColorAdjustmentMode;
    float g_flPaintRoughness;
    float g_flPearlescentScale;
    int g_bPearlescentOnMetallicOnly;
    float g_flPaintMetalness;
    float g_flWearAmount;
    float g_flCaseHardeningPatternInfluence;
    float g_flCaseHardeningGeometricInfluence;
    float g_flCaseHardeningRampOffset;
    vec3 g_vPaintAlbedoLevels;
    vec3 g_vMetallicPaintAlbedoLevels;
    int nOverlayMaskMode;
    int nOverlayBlendMode;
};

layout(set = 1) uniform _1460 _Globals_;

layout(set = 1, binding = 30) uniform texture2D g_tAmbientOcclusion;
layout(set = 1, binding = 23) uniform sampler g_sTrilinearClamp;
layout(set = 1, binding = 31) uniform texture2D g_tMasks;
layout(set = 1, binding = 41) uniform texture2D g_tWear;
layout(set = 1, binding = 22) uniform sampler g_sTrilinearWrap;
layout(set = 1, binding = 40) uniform texture2D g_tPattern;
layout(set = 1, binding = 27) uniform sampler AddressU_dynamic_AddressV_dynamic;
layout(set = 1, binding = 36) uniform texture2D g_tNormal;
layout(set = 1, binding = 43) uniform texture2D g_tCaseHardeningColorRamp;
layout(set = 1, binding = 38) uniform texture2D g_tOverlay;
layout(set = 1, binding = 39) uniform texture2D g_tOverlayMask;
layout(set = 1, binding = 42) uniform texture2D g_tGrunge;
layout(set = 1, binding = 35) uniform texture2D g_tMetalness;
layout(set = 1, binding = 34) uniform texture2D g_tColor;
layout(set = 1, binding = 37) uniform texture2D g_tGlitterNormal;

layout(location = 1) in vec4 input_1;
layout(location = 2) in vec4 input_2;
layout(location = 3) in vec2 input_3;
layout(location = 0) out vec4 output_0;

void main()
{
    vec4 _19372 = texture(sampler2D(g_tAmbientOcclusion, g_sTrilinearClamp), input_1.xy);
    float _4306 = _19372.x;
    float _5542 = _19372.y;
    vec4 _19373 = texture(sampler2D(g_tMasks, g_sTrilinearClamp), input_1.xy);
    float _17150 = _19373.x;
    float _13255 = 1.0 - _17150;
    vec4 _19334 = texture(sampler2D(g_tWear, g_sTrilinearWrap), input_2.xy);
    float _5744 = _19334.x;
    vec4 _22452 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), input_1.zw);
    vec4 _9448 = texture(sampler2D(g_tNormal, g_sTrilinearWrap), input_1.xy);
    vec4 _19604 = smoothstep(vec4(0.85000002384185791015625), vec4(0.20000000298023223876953125), min(_9448, vec4(1.0) - _9448));
    float _4409 = mix(0.5, pow(_4306, 0.85000002384185791015625), _Globals_.g_flCaseHardeningGeometricInfluence) * mix(1.0, _5542 * (min(_19604.x, _19604.y) * 2.0), _Globals_.g_flCaseHardeningGeometricInfluence);
    float _6306 = _4409 * 2.0;
    float _3407 = max(_22452.y * _Globals_.g_flCaseHardeningPatternInfluence, ((1.0 - _5542) * 0.20000000298023223876953125) * _Globals_.g_flCaseHardeningGeometricInfluence) + _Globals_.g_flCaseHardeningRampOffset;
    vec4 _20284 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), (input_1.zw + vec2(0.00048828125, -0.00048828125)).xy);
    vec4 _20633 = texture(sampler2D(g_tCaseHardeningColorRamp, g_sTrilinearClamp), vec2(mix(_6306, _4409 + _20284.x, _Globals_.g_flCaseHardeningPatternInfluence), _3407));
    float _7414 = _19373.y;
    vec4 _6449 = mix(_22452.xyzw, (((((texture(sampler2D(g_tCaseHardeningColorRamp, g_sTrilinearClamp), vec2(mix(_6306, _4409 + _22452.x, _Globals_.g_flCaseHardeningPatternInfluence), _3407)).xyzw + texture(sampler2D(g_tCaseHardeningColorRamp, g_sTrilinearClamp), vec2(mix(_6306, _4409 + texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), (input_1.zw + vec2(0.00048828125)).xy).x, _Globals_.g_flCaseHardeningPatternInfluence), _3407)).xyzw).xyzw + texture(sampler2D(g_tCaseHardeningColorRamp, g_sTrilinearClamp), vec2(mix(_6306, _4409 + texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), (input_1.zw + vec2(-0.00048828125)).xy).x, _Globals_.g_flCaseHardeningPatternInfluence), _3407)).xyzw).xyzw + texture(sampler2D(g_tCaseHardeningColorRamp, g_sTrilinearClamp), vec2(mix(_6306, _4409 + texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), (input_1.zw + vec2(-0.00048828125, 0.00048828125)).xy).x, _Globals_.g_flCaseHardeningPatternInfluence), _3407)).xyzw).xyzw + _20633.xyzw).xyzw * 0.20000000298023223876953125).xyzw, vec4(_7414));
    float _24686 = _6449.w;
    float _8211 = mix(1.0, _24686, _7414);
    vec4 _22453 = texture(sampler2D(g_tOverlay, g_sTrilinearWrap), input_3.xy);
    vec4 _19068 = texture(sampler2D(g_tOverlayMask, g_sTrilinearWrap), input_1.xy);
    vec4 _19017;
    if (_Globals_.nOverlayMaskMode == 8)
    {
        vec4 _18602 = _22453;
        _18602.w = _22453.w * _19068.x;
        _19017 = _18602;
    }
    else
    {
        _19017 = _22453;
    }
    float _8479 = _19017.w * _Globals_.g_fOverlayStrength;
    vec4 _22344 = vec4(_19017.xyz * _Globals_.g_fOverlayBrightness, _8479);
    float _7402 = _5744 * _4306;
    float _10547 = (_Globals_.g_flWearAmount * 6.0) + 1.0;
    float _11571 = smoothstep(0.0, 0.5, _24686);
    bool _13348 = _Globals_.nOverlayMaskMode == 0;
    float _21709;
    if (_13348)
    {
        _21709 = max(0.0, _11571);
    }
    else
    {
        _21709 = _11571;
    }
    float _4109 = _21709 * mix(1.0, _Globals_.g_fOverlayDurability, _19017.w);
    float _10021;
    if (_Globals_.nOverlayMaskMode > 0)
    {
        _10021 = max(0.0, _4109);
    }
    else
    {
        _10021 = _4109;
    }
    float _14472 = (((min(_19372.w, _13255) + _7402) * _10547) + (smoothstep(0.5, 0.60000002384185791015625, _24686) * smoothstep(1.0, 0.89999997615814208984375, _24686))) * _10021;
    float _4693 = _Globals_.g_fWearSoftness * _10021;
    float _11674 = 0.579999983310699462890625 - _4693;
    float _14292 = 0.680000007152557373046875 + _4693;
    bool _18318 = _17150 > 0.9900000095367431640625;
    float _15607 = mix(smoothstep(_11674, _14292, _14472), _14472, float(_18318));
    float _16667 = smoothstep(_11674, _14292, (_7402 * _10547) * _Globals_.g_fOverlayDurability);
    float _21710;
    SPIRV_CROSS_BRANCH
    if (_13348)
    {
        _21710 = max(0.0, mix(_15607, min(_15607, _16667), _8479));
    }
    else
    {
        _21710 = _15607;
    }
    vec4 _19287;
    SPIRV_CROSS_BRANCH
    if (_Globals_.nOverlayBlendMode == 4)
    {
        vec4 _11598 = _22344;
        _11598.w = _8479 * saturate(1.0 - _16667);
        _19287 = _11598;
    }
    else
    {
        _19287 = _22344;
    }
    vec4 _19374 = texture(sampler2D(g_tGrunge, g_sTrilinearWrap), input_2.zw);
    vec4 _25204 = mix(vec4(1.0), _19374, vec4((pow(1.0 - _4306, 4.0) * 0.25) + (0.75 * _Globals_.g_flWearAmount)));
    float _8353 = smoothstep(0.100000001490116119384765625, 0.20000000298023223876953125, ((_5744 * _5542) * (_4306 * _4306)) * _Globals_.g_flWearAmount);
    float _24589 = smoothstep(0.0, 0.1500000059604644775390625, (saturate((_4306 * _5542) - (_Globals_.g_flWearAmount * 0.100000001490116119384765625)) - (saturate((_19374.x * _19374.y) * _19374.z) * 0.23000000417232513427734375)) + 0.07999999821186065673828125);
    float _10247;
    vec4 _11711;
    if (_Globals_.bRoughnessMode != 0)
    {
        vec4 _20322 = texture(sampler2D(g_tMetalness, g_sTrilinearClamp), input_1.xy);
        float _7921 = 1.0 - _21710;
        float _17973 = mix(_Globals_.g_flPaintRoughness, _Globals_.g_flPaintRoughness * (1.0 - (0.25 * dot(_6449.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)))), _7414);
        float _24500 = 1.0 - min(1.0, _24686 * 2.0);
        float _9781 = dot(_25204.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
        float _23988 = _25204.w;
        float _19555 = (1.0 - _23988) * _Globals_.g_flWearAmount;
        float _20709 = saturate((((mix(_17973, mix(((_24500 * _24500) * 0.85000002384185791015625) + 0.1500000059604644775390625, _17973, float(_24686 >= 0.5)), _17150) * mix(1.0, 0.89999997615814208984375, _8353)) + (((1.0 - _9781) * _Globals_.g_flWearAmount) * 0.0500000007450580596923828125)) + (((1.0 - _24589) * 0.1500000059604644775390625) * _Globals_.g_flWearAmount)) + (_19555 * 0.1500000059604644775390625));
        float _13900 = mix(_8211 * mix(1.0, pow((_24589 * _23988) * _9781, 0.5), _Globals_.g_flWearAmount), 1.0, _8353);
        float _10825 = ((1.0 - _16667) * _19287.w) * _Globals_.g_fOverlayMaterialStrength;
        vec4 _12896;
        _12896.x = mix(mix(_20322.x, mix(min(1.0, _20709 + ((_19555 * _Globals_.g_flWearAmount) * 0.5)), _20709, _17150), _18318 ? 1.0 : max(0.0, _7921)), _Globals_.g_fOverlayRoughness, _10825);
        _12896.y = mix(mix(mix(_Globals_.g_flPaintMetalness, _20322.y, _21710), _13900, _17150), _Globals_.g_fOverlayMetalness, _10825);
        _12896.z = _7921;
        vec4 _19018;
        if (_Globals_.g_bPearlescentOnMetallicOnly != 0)
        {
            vec4 _21219 = _12896;
            _21219.z = _7921 * _17150;
            _19018 = _21219;
        }
        else
        {
            _19018 = _12896;
        }
        float _9193 = mix(_19018.z, _Globals_.g_fOverlayPearlescentMask - _21710, _10825);
        vec4 _7773 = _19018;
        _7773.z = _9193;
        vec3 _18043 = _7773.xyz * vec3(0.077399380505084991455078125);
        vec3 _7676 = pow((_7773.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _21354;
        if (_19018.x <= 0.040449999272823333740234375)
        {
            _21354 = _18043.x;
        }
        else
        {
            _21354 = _7676.x;
        }
        float _23035;
        if (_19018.y <= 0.040449999272823333740234375)
        {
            _23035 = _18043.y;
        }
        else
        {
            _23035 = _7676.y;
        }
        float _19513;
        if (_9193 <= 0.040449999272823333740234375)
        {
            _19513 = _18043.z;
        }
        else
        {
            _19513 = _7676.z;
        }
        vec4 _17156 = vec4(_21354, _23035, _9193, min(1.0, _Globals_.g_flPearlescentScale));
        _17156.z = _19513;
        _11711 = _17156;
        _10247 = _13900;
    }
    else
    {
        _11711 = vec4(input_1.xy, 0.0, 1.0);
        _10247 = _8211;
    }
    vec4 _22401;
    if (_Globals_.bRoughnessMode == 0)
    {
        vec4 _22121 = texture(sampler2D(g_tColor, g_sTrilinearClamp), input_1.xy);
        vec3 _22868 = vec3(_Globals_.g_flWearAmount);
        vec3 _21096 = _6449.xyz;
        vec3 _15472 = mix(_21096, _21096 * _Globals_.g_flColorBrightness, vec3(max(_17150, float(_Globals_.g_nColorAdjustmentMode))));
        vec4 _17842;
        _17842.x = _15472.x;
        _17842.y = _15472.y;
        _17842.z = _15472.z;
        vec3 _15248 = mix(mix(mix(_Globals_.g_vColor1, _Globals_.g_vColor3, vec3(pow(_Globals_.g_flWearAmount, 0.5))), mix(_Globals_.g_vColor1, _Globals_.g_vColor2, _22868), vec3(_24589)) * _17842.xyz, _Globals_.g_vColor0 * dot(_17842.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), vec3(_8353));
        float _8057 = (1.0 - _16667) * _19287.w;
        vec4 _16320 = vec4(_19287.xyz, _8057);
        vec3 _9750;
        SPIRV_CROSS_BRANCH
        switch (_Globals_.nOverlayBlendMode)
        {
            case 0:
            {
                _9750 = mix(_15248.xyz, _16320.xyz, vec3(_8057));
                break;
            }
            case 1:
            {
                vec3 _15092 = _15248.xyz;
                vec3 _19212 = normalize(max(vec3(0.0003000000142492353916168212890625), (_16320.xyz * _15092).xyz)) * 1.059999942779541015625;
                vec3 _13607 = _19212.xyz;
                _9750 = mix(_15092, mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13607 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13607))) / vec3(dot(_19212.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19212 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_15248.x, max(_15248.y, _15248.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_15092 * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz, vec3(_8057));
                break;
            }
            case 2:
            {
                vec3 _14038 = _15248.xyz;
                vec3 _23491 = _14038 * _16320.xyz;
                vec3 _19213 = normalize(max(vec3(0.0003000000142492353916168212890625), _23491.xyz)) * 1.059999942779541015625;
                vec3 _13608 = _19213.xyz;
                _9750 = mix(_14038, mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13608 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13608))) / vec3(dot(_19213.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19213 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23491.x, max(_23491.y, _23491.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23491.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz, vec3(_8057));
                break;
            }
            case 3:
            {
                vec3 _13962 = _15248.xyz;
                vec3 _18121 = _13962 + _16320.xyz;
                float _7245 = dot(saturate(_18121.xyz * 2.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                vec3 _19214 = normalize(max(vec3(0.0003000000142492353916168212890625), _18121.xyz)) * 1.059999942779541015625;
                vec3 _13609 = _19214.xyz;
                vec3 _19113 = max((((_13609 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13609))) / vec3(dot(_19214.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19214 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_18121.x, max(_18121.y, _18121.z)) * 2.0, _Globals_.g_vAlbedoLevels.y)))).xyz;
                _9750 = mix(_13962, mix(vec3(_Globals_.g_vAlbedoLevels.x), mix(_19113, min(_Globals_.g_vAlbedoLevels.zzz, _19113 + (vec3(_7245) * 2.0)), vec3(1.0 / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, _7245), 0.5))).xyz, vec3(_8057));
                break;
            }
            case 4:
            {
                _9750 = mix(_15248.xyz, _16320.xyz, vec3(_8057));
                break;
            }
            default:
            {
                _9750 = _15248.xyz;
                break;
            }
        }
        vec3 _11960 = _22121.xyz;
        vec3 _18755 = mix(saturate(_17842.xyz), _11960, vec3(_21710));
        vec3 _19340;
        SPIRV_CROSS_BRANCH
        switch (_Globals_.nOverlayBlendMode)
        {
            case 0:
            {
                _19340 = mix(_18755.xyz, _19287.xyz, vec3(_19287.w));
                break;
            }
            case 1:
            {
                vec3 _19478 = _18755.xyz;
                vec3 _19215 = normalize(max(vec3(0.0003000000142492353916168212890625), (_19287.xyz * _19478).xyz)) * 1.059999942779541015625;
                vec3 _13610 = _19215.xyz;
                _19340 = mix(_18755.xyz, mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13610 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13610))) / vec3(dot(_19215.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19215 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_18755.x, max(_18755.y, _18755.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_19478 * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz, vec3(_19287.w));
                break;
            }
            case 2:
            {
                vec3 _14039 = _18755.xyz;
                vec3 _23492 = _14039 * _19287.xyz;
                vec3 _19216 = normalize(max(vec3(0.0003000000142492353916168212890625), _23492.xyz)) * 1.059999942779541015625;
                vec3 _13611 = _19216.xyz;
                _19340 = mix(_14039, mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13611 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13611))) / vec3(dot(_19216.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19216 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23492.x, max(_23492.y, _23492.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23492.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz, vec3(_19287.w));
                break;
            }
            case 3:
            {
                vec3 _13964 = _18755.xyz;
                vec3 _18122 = _13964 + _19287.xyz;
                float _7248 = dot(saturate(_18122.xyz * 2.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                vec3 _19217 = normalize(max(vec3(0.0003000000142492353916168212890625), _18122.xyz)) * 1.059999942779541015625;
                vec3 _13612 = _19217.xyz;
                vec3 _19114 = max((((_13612 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13612))) / vec3(dot(_19217.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19217 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_18122.x, max(_18122.y, _18122.z)) * 2.0, _Globals_.g_vAlbedoLevels.y)))).xyz;
                _19340 = mix(_13964, mix(vec3(_Globals_.g_vAlbedoLevels.x), mix(_19114, min(_Globals_.g_vAlbedoLevels.zzz, _19114 + (vec3(_7248) * 2.0)), vec3(1.0 / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, _7248), 0.5))).xyz, vec3(_19287.w));
                break;
            }
            case 4:
            {
                _19340 = mix(_18755.xyz, _19287.xyz, vec3(_19287.w));
                break;
            }
            default:
            {
                _19340 = _18755;
                break;
            }
        }
        vec4 _23944;
        _23944.x = _19340.x;
        _23944.y = _19340.y;
        _23944.z = _19340.z;
        vec3 _21371 = vec3(_17150);
        vec3 _21103 = mix(_23944.xyz, _9750, _21371).xyz * _25204.xyz;
        vec3 _21271 = normalize(max(vec3(0.0003000000142492353916168212890625), _21103.xyz));
        vec3 _23898 = mix(_Globals_.g_vPaintAlbedoLevels.xyz, _Globals_.g_vMetallicPaintAlbedoLevels.xyz, vec3(mix(_Globals_.g_flPaintMetalness, _10247, _17150)));
        _22401 = vec4(mix(mix(_21103, ((_21271.xyz * mix(min(_23898.x, dot(mix(_23944.xyz, _23944.xyz * _Globals_.g_vColor1, _21371).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _23898.z, saturate(pow(max(_21103.x, max(_21103.y, _21103.z)), _23898.y)))) / vec3(max(_21271.x, max(_21271.y, _21271.z)))).xyz, _22868), _11960, vec3(_21710 * _13255)), 1.0);
    }
    else
    {
        _22401 = _11711;
    }
    vec4 _3401 = texture(sampler2D(g_tGlitterNormal, g_sTrilinearWrap), input_1.xy);
    vec4 _6805;
    if (_3401.w < 0.0)
    {
        vec4 _23136 = _22401;
        _23136.x = _3401.x;
        _23136.y = _3401.y;
        _23136.z = _3401.z;
        _6805 = _23136;
    }
    else
    {
        _6805 = _22401;
    }
    output_0 = _6805;
}


