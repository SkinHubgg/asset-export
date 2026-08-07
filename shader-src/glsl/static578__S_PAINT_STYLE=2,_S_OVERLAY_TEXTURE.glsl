// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 0 (name: g_vPatternTexCoordXform0) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (25588 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=2, S_OVERLAY_TEXTURE

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

const vec2 _63[17] = vec2[](vec2(-0.00107233994640409946441650390625, -0.004002030007541179656982421875), vec2(0.001953119994141161441802978515625, -0.0033829100430011749267578125), vec2(0.004002030007541179656982421875, -0.00107233994640409946441650390625), vec2(-0.00071489601396024227142333984375, -0.00266802008263766765594482421875), vec2(0.000976564944721758365631103515625, -0.001691460027359426021575927734375), vec2(0.00266802008263766765594482421875, -0.00071489601396024227142333984375), vec2(-0.0033829100430011749267578125, -0.001953119994141161441802978515625), vec2(-0.001691460027359426021575927734375, -0.000976564944721758365631103515625), vec2(0.0), vec2(0.001691460027359426021575927734375, 0.000976564944721758365631103515625), vec2(0.0033829100430011749267578125, 0.001953119994141161441802978515625), vec2(-0.00266802008263766765594482421875, 0.00071489601396024227142333984375), vec2(-0.000976564944721758365631103515625, 0.001691460027359426021575927734375), vec2(0.00071489601396024227142333984375, 0.00266802008263766765594482421875), vec2(-0.004002030007541179656982421875, 0.00107233994640409946441650390625), vec2(-0.001953119994141161441802978515625, 0.0033829100430011749267578125), vec2(0.00107233994640409946441650390625, 0.0040020202286541461944580078125));

struct _1436
{
    vec4 g_vPatternTexCoordXform0;
    vec4 g_vPatternTexCoordXform1;
    vec4 g_vPatternTexCoordXformHalftoneA0;
    vec4 g_vPatternTexCoordXformHalftoneA1;
    vec4 g_vPatternTexCoordXformHalftoneB0;
    vec4 g_vPatternTexCoordXformHalftoneB1;
    vec4 g_vPatternTexCoordXformHalftoneC0;
    vec4 g_vPatternTexCoordXformHalftoneC1;
    int bRoughnessMode;
    int bSpraypaintHalftone;
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
    vec4 g_vPaintDurability;
    float g_flPaintRoughness;
    int g_bRoughnessPerColor;
    vec4 g_vPaintRoughness;
    float g_flPearlescentScale;
    vec4 g_vPaintMetalness;
    float g_flWearAmount;
    vec3 g_vSprayBiasBlend;
    float g_fHalftoneCavityCutoff;
    vec3 g_vHalftonePatternLevels;
    vec2 g_vHalftoneThresholds;
    int g_bHalftoneInCavity;
    vec3 g_vPaintAlbedoLevels;
    vec3 g_vMetallicPaintAlbedoLevels;
    int nOverlayMaskMode;
    int nOverlayBlendMode;
};

layout(set = 1) uniform _1436 _Globals_;

layout(set = 1, binding = 30) uniform texture2D g_tAmbientOcclusion;
layout(set = 1, binding = 23) uniform sampler g_sTrilinearClamp;
layout(set = 1, binding = 33) uniform texture2D g_tPosition;
layout(set = 1, binding = 40) uniform texture2D g_tWear;
layout(set = 1, binding = 22) uniform sampler g_sTrilinearWrap;
layout(set = 1, binding = 27) uniform sampler AddressU_dynamic_AddressV_dynamic;
layout(set = 1, binding = 32) uniform texture2D g_tSurface;
layout(set = 1, binding = 39) uniform texture2D g_tPattern;
layout(set = 1, binding = 37) uniform texture2D g_tOverlay;
layout(set = 1, binding = 41) uniform texture2D g_tGrunge;
layout(set = 1, binding = 35) uniform texture2D g_tMetalness;
layout(set = 1, binding = 34) uniform texture2D g_tColor;
layout(set = 1, binding = 36) uniform texture2D g_tGlitterNormal;

layout(location = 1) in vec4 input_1;
layout(location = 2) in vec4 input_2;
layout(location = 3) in vec2 input_3;
layout(location = 0) out vec4 output_0;

void main()
{
    vec4 _19372 = texture(sampler2D(g_tAmbientOcclusion, g_sTrilinearClamp), input_1.xy);
    float _4306 = _19372.x;
    float _5542 = _19372.y;
    vec4 _13155;
    _13155 = vec4(0.0);
    int _18752;
    vec4 _19130;
    int _16208 = 0;
    for (;;)
    {
        if (!(_16208 < 17))
        {
            break;
        }
        _19130 = _13155 + (texture(sampler2D(g_tPosition, g_sTrilinearClamp), (input_1.xy + (_63[_16208] * 0.20000000298023223876953125)).xy) * 0.0588235296308994293212890625);
        _18752 = _16208 + 1;
        _13155 = _19130;
        _16208 = _18752;
        continue;
    }
    vec4 _11428 = _13155 * 2.0;
    bool _14874 = _Globals_.bSpraypaintHalftone != 0;
    vec4 _18941;
    SPIRV_CROSS_BRANCH
    if (_14874)
    {
        vec4 _18602 = _11428;
        _18602.z = _11428.z * (-1.0);
        _18941 = _18602;
    }
    else
    {
        _18941 = _11428;
    }
    vec4 _19068 = texture(sampler2D(g_tWear, g_sTrilinearWrap), input_2.xy);
    vec4 _20877 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
    vec3 _6906 = normalize((_20877.xyz * 2.0) - vec3(1.0));
    vec4 _19680 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yz, _Globals_.g_vPatternTexCoordXform0.xy) + _Globals_.g_vPatternTexCoordXform0.w, dot(_18941.yz, _Globals_.g_vPatternTexCoordXform1.xy) + _Globals_.g_vPatternTexCoordXform1.w));
    vec4 _19681 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.xz, _Globals_.g_vPatternTexCoordXform0.xy) + _Globals_.g_vPatternTexCoordXform0.w, dot(_18941.xz, _Globals_.g_vPatternTexCoordXform1.xy) + _Globals_.g_vPatternTexCoordXform1.w));
    vec4 _19718 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yx, _Globals_.g_vPatternTexCoordXform0.xy) + _Globals_.g_vPatternTexCoordXform0.w, dot(_18941.yx, _Globals_.g_vPatternTexCoordXform1.xy) + _Globals_.g_vPatternTexCoordXform1.w));
    vec4 _17673 = mix(mix(_19680.xyzw, _19681.xyzw, vec4(_Globals_.g_vSprayBiasBlend.y * pow(abs(_6906.y), 7.0))), _19718.xyzw, vec4(_Globals_.g_vSprayBiasBlend.z * pow(abs(_6906.z), 7.0)));
    vec4 _22743;
    SPIRV_CROSS_BRANCH
    if (_14874)
    {
        vec4 _20878 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
        vec3 _8217 = normalize((_20878.xyz * 2.0) - vec3(1.0));
        vec4 _20991 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneA0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA0.w, dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneA1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA1.w));
        vec4 _20992 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneA0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA0.w, dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneA1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA1.w));
        vec4 _19719 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneA0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA0.w, dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneA1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA1.w));
        vec4 _20879 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
        vec3 _8218 = normalize((_20879.xyz * 2.0) - vec3(1.0));
        vec4 _20993 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneB0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB0.w, dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneB1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB1.w));
        vec4 _20994 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneB0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB0.w, dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneB1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB1.w));
        vec4 _19720 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneB0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB0.w, dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneB1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB1.w));
        vec4 _20880 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
        vec3 _8219 = normalize((_20880.xyz * 2.0) - vec3(1.0));
        vec4 _20995 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneC0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneC0.w, dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneC1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneC1.w));
        vec4 _20996 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneC0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneC0.w, dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneC1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneC1.w));
        vec4 _19721 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneC0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneC0.w, dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneC1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneC1.w));
        vec4 _21709;
        SPIRV_CROSS_BRANCH
        if (_Globals_.g_bHalftoneInCavity != 0)
        {
            float _17464 = smoothstep(_Globals_.g_vHalftonePatternLevels.x, _Globals_.g_vHalftonePatternLevels.z, pow((min(_4306, _Globals_.g_fHalftoneCavityCutoff) * _5542) * 2.0, _Globals_.g_vHalftonePatternLevels.y));
            vec4 _12502;
            SPIRV_CROSS_BRANCH
            if (_Globals_.g_vHalftoneThresholds.x > _Globals_.g_vHalftoneThresholds.y)
            {
                vec3 _8829 = _17673.xyz * _17464;
                vec4 _8677 = _17673;
                _8677.x = _8829.x;
                _8677.y = _8829.y;
                _8677.z = _8829.z;
                _12502 = _8677;
            }
            else
            {
                vec3 _9522 = _17673.xyz * (1.0 - _17464);
                vec4 _8676 = _17673;
                _8676.x = _9522.x;
                _8676.y = _9522.y;
                _8676.z = _9522.z;
                _12502 = _8676;
            }
            _21709 = _12502;
        }
        else
        {
            float _17463 = smoothstep(_Globals_.g_vHalftonePatternLevels.x, _Globals_.g_vHalftonePatternLevels.z, pow((_4306 * _5542) * 2.0, _Globals_.g_vHalftonePatternLevels.y));
            vec4 _12501;
            SPIRV_CROSS_BRANCH
            if (_Globals_.g_vHalftoneThresholds.x > _Globals_.g_vHalftoneThresholds.y)
            {
                vec3 _9521 = _17673.xyz * (1.0 - _17463);
                vec4 _8675 = _17673;
                _8675.x = _9521.x;
                _8675.y = _9521.y;
                _8675.z = _9521.z;
                _12501 = _8675;
            }
            else
            {
                vec3 _8828 = _17673.xyz * _17463;
                vec4 _8674 = _17673;
                _8674.x = _8828.x;
                _8674.y = _8828.y;
                _8674.z = _8828.z;
                _12501 = _8674;
            }
            _21709 = _12501;
        }
        vec3 _13843 = _21709.xyz * vec3(mix(mix(_20991.xyzw, _20992.xyzw, vec4(_Globals_.g_vSprayBiasBlend.y * pow(abs(_8217.y), 7.0))), _19719.xyzw, vec4(_Globals_.g_vSprayBiasBlend.z * pow(abs(_8217.z), 7.0))).w, mix(mix(_20993.xyzw, _20994.xyzw, vec4(_Globals_.g_vSprayBiasBlend.y * pow(abs(_8218.y), 7.0))), _19720.xyzw, vec4(_Globals_.g_vSprayBiasBlend.z * pow(abs(_8218.z), 7.0))).w, mix(mix(_20995.xyzw, _20996.xyzw, vec4(_Globals_.g_vSprayBiasBlend.y * pow(abs(_8219.y), 7.0))), _19721.xyzw, vec4(_Globals_.g_vSprayBiasBlend.z * pow(abs(_8219.z), 7.0))).w);
        vec3 _9149 = smoothstep(vec3(_Globals_.g_vHalftoneThresholds.x), vec3(_Globals_.g_vHalftoneThresholds.y), _13843);
        vec4 _15713 = _21709;
        _15713.x = _9149.x;
        _15713.y = _9149.y;
        _15713.z = _9149.z;
        _22743 = _15713;
    }
    else
    {
        _22743 = _17673;
    }
    vec4 _21760 = texture(sampler2D(g_tOverlay, g_sTrilinearWrap), input_3.xy);
    vec4 _19017;
    SPIRV_CROSS_BRANCH
    switch (_Globals_.nOverlayMaskMode)
    {
        case 1:
        {
            vec4 _18607 = _21760;
            _18607.w = _21760.w * (1.0 - max(_22743.x, max(_22743.y, _22743.z)));
            _19017 = _18607;
            break;
        }
        case 2:
        {
            vec4 _18606 = _21760;
            _18606.w = _21760.w * (_22743.x * (1.0 - max(_22743.y, _22743.z)));
            _19017 = _18606;
            break;
        }
        case 3:
        {
            vec4 _18605 = _21760;
            _18605.w = _21760.w * (_22743.y * (1.0 - _22743.z));
            _19017 = _18605;
            break;
        }
        case 4:
        {
            vec4 _18604 = _21760;
            _18604.w = _21760.w * _22743.z;
            _19017 = _18604;
            break;
        }
        case 5:
        {
            vec4 _18603 = _21760;
            _18603.w = _21760.w * max(_22743.x, max(_22743.y, _22743.z));
            _19017 = _18603;
            break;
        }
        case 7:
        {
            _19017 = _21760;
            break;
        }
        default:
        {
            _19017 = _21760;
            break;
        }
    }
    float _8479 = _19017.w * _Globals_.g_fOverlayStrength;
    vec4 _22344 = vec4(_19017.xyz * _Globals_.g_fOverlayBrightness, _8479);
    float _7402 = _19068.x * _4306;
    float _10548 = (_Globals_.g_flWearAmount * 6.0) + 1.0;
    float _10779 = mix(mix(mix(_Globals_.g_vPaintDurability.x, _Globals_.g_vPaintDurability.y, _22743.x), _Globals_.g_vPaintDurability.z, _22743.y), _Globals_.g_vPaintDurability.w, _22743.z);
    float _5486 = (((_19372.w + _7402) * _10548) * mix(1.0, _Globals_.g_fOverlayDurability, _19017.w)) * _10779;
    float _4693 = _Globals_.g_fWearSoftness * _10779;
    float _25193 = 0.560000002384185791015625 - (0.0599999986588954925537109375 * _Globals_.g_flWearAmount);
    float _17192 = 0.540000021457672119140625 - (_Globals_.g_flWearAmount * 0.119999997317790985107421875);
    vec3 _21103 = _22743.xyz * vec3(smoothstep(0.579999983310699462890625 + _4693, _25193 - _4693, _5486), smoothstep(_25193 + _4693, _17192 - _4693, _5486), smoothstep(_17192 + _4693, (0.519999980926513671875 - (_Globals_.g_flWearAmount * 0.17999999225139617919921875)) - _4693, _5486)).xyz;
    float _12931 = _21103.x;
    float _13767 = _21103.y;
    float _14497 = _21103.z;
    float _22581 = 0.579999983310699462890625 - _4693;
    float _20453 = 0.680000007152557373046875 + _4693;
    float _21647 = smoothstep(_22581, _20453, _5486);
    float _23189 = smoothstep(_22581, _20453, (_7402 * _10548) * _Globals_.g_fOverlayDurability);
    float _21710;
    SPIRV_CROSS_BRANCH
    if (_Globals_.nOverlayMaskMode == 0)
    {
        _21710 = max(0.0, mix(_21647, min(_21647, _23189), _8479));
    }
    else
    {
        _21710 = _21647;
    }
    vec4 _19287;
    SPIRV_CROSS_BRANCH
    if (_Globals_.nOverlayBlendMode == 4)
    {
        vec4 _11598 = _22344;
        _11598.w = _8479 * saturate(1.0 - _23189);
        _19287 = _11598;
    }
    else
    {
        _19287 = _22344;
    }
    vec4 _9437 = texture(sampler2D(g_tGrunge, g_sTrilinearWrap), input_2.zw);
    vec4 _16529 = mix(vec4(1.0), _9437, vec4((pow(1.0 - _4306, 4.0) * 0.25) + (0.75 * _Globals_.g_flWearAmount)));
    float _7177 = mix(mix(mix(_Globals_.g_vPaintMetalness.x, _Globals_.g_vPaintMetalness.y, _12931), _Globals_.g_vPaintMetalness.z, _13767), _Globals_.g_vPaintMetalness.w, _14497);
    float _10247;
    vec4 _11711;
    if (_Globals_.bRoughnessMode != 0)
    {
        vec4 _19391 = texture(sampler2D(g_tMetalness, g_sTrilinearClamp), input_1.xy);
        _19391.x = _19391.x;
        float _21711;
        SPIRV_CROSS_BRANCH
        if (_Globals_.g_bRoughnessPerColor != 0)
        {
            _21711 = mix(mix(mix(_Globals_.g_vPaintRoughness.x, _Globals_.g_vPaintRoughness.y, _12931), _Globals_.g_vPaintRoughness.z, _13767), _Globals_.g_vPaintRoughness.w, _14497);
        }
        else
        {
            _21711 = _Globals_.g_flPaintRoughness;
        }
        float _10825 = ((1.0 - _23189) * _19287.w) * _Globals_.g_fOverlayMaterialStrength;
        float _13705 = mix(_7177, _Globals_.g_fOverlayMetalness, _10825);
        vec4 _13796 = mix(vec4(min(1.0, mix(_21711, _Globals_.g_fOverlayRoughness, _10825) + ((((1.0 - _16529.w) * _Globals_.g_flWearAmount) * _Globals_.g_flWearAmount) * 0.5)), _13705, 0.0, 1.0), _19391, vec4(_21710));
        float _9193 = mix(1.0 - _21710, _Globals_.g_fOverlayPearlescentMask - _21710, _10825);
        vec4 _7782 = _13796;
        _7782.z = _9193;
        vec3 _18043 = _7782.xyz * vec3(0.077399380505084991455078125);
        vec3 _7676 = pow((_7782.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _21354;
        if (_13796.x <= 0.040449999272823333740234375)
        {
            _21354 = _18043.x;
        }
        else
        {
            _21354 = _7676.x;
        }
        float _23035;
        if (_13796.y <= 0.040449999272823333740234375)
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
        _10247 = _13705;
    }
    else
    {
        _11711 = vec4(input_1.xy, 0.0, 1.0);
        _10247 = _7177;
    }
    vec4 _22401;
    if (_Globals_.bRoughnessMode == 0)
    {
        vec4 _22121 = texture(sampler2D(g_tColor, g_sTrilinearClamp), input_1.xy);
        vec3 _22737 = _22121.xyz;
        vec3 _24345 = vec3(_21710);
        vec3 _18755 = mix(mix(mix(mix(_Globals_.g_vColor0, _Globals_.g_vColor1, vec3(_12931)), _Globals_.g_vColor2, vec3(_13767)), _Globals_.g_vColor3, vec3(_14497)).xyz, _22737, _24345);
        vec3 _21712;
        SPIRV_CROSS_BRANCH
        switch (_Globals_.nOverlayBlendMode)
        {
            case 0:
            {
                _21712 = mix(_18755.xyz, _19287.xyz, vec3(_19287.w));
                break;
            }
            case 1:
            {
                vec3 _19478 = _18755.xyz;
                vec3 _19214 = normalize(max(vec3(0.0003000000142492353916168212890625), (_19287.xyz * _19478).xyz)) * 1.059999942779541015625;
                vec3 _13611 = _19214.xyz;
                _21712 = mix(_18755.xyz, mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13611 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13611))) / vec3(dot(_19214.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19214 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_18755.x, max(_18755.y, _18755.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_19478 * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz, vec3(_19287.w));
                break;
            }
            case 2:
            {
                vec3 _14038 = _18755.xyz;
                vec3 _23491 = _14038 * _19287.xyz;
                vec3 _19213 = normalize(max(vec3(0.0003000000142492353916168212890625), _23491.xyz)) * 1.059999942779541015625;
                vec3 _13610 = _19213.xyz;
                _21712 = mix(_14038, mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13610 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13610))) / vec3(dot(_19213.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19213 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23491.x, max(_23491.y, _23491.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23491.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz, vec3(_19287.w));
                break;
            }
            case 3:
            {
                vec3 _13962 = _18755.xyz;
                vec3 _18121 = _13962 + _19287.xyz;
                float _7243 = dot(saturate(_18121.xyz * 2.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                vec3 _19212 = normalize(max(vec3(0.0003000000142492353916168212890625), _18121.xyz)) * 1.059999942779541015625;
                vec3 _13609 = _19212.xyz;
                vec3 _19113 = max((((_13609 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13609))) / vec3(dot(_19212.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19212 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_18121.x, max(_18121.y, _18121.z)) * 2.0, _Globals_.g_vAlbedoLevels.y)))).xyz;
                _21712 = mix(_13962, mix(vec3(_Globals_.g_vAlbedoLevels.x), mix(_19113, min(_Globals_.g_vAlbedoLevels.zzz, _19113 + (vec3(_7243) * 2.0)), vec3(1.0 / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, _7243), 0.5))).xyz, vec3(_19287.w));
                break;
            }
            case 4:
            {
                _21712 = mix(_18755.xyz, _19287.xyz, vec3(_19287.w));
                break;
            }
            default:
            {
                _21712 = _18755;
                break;
            }
        }
        vec3 _19616 = saturate(_21712 * mix(_Globals_.g_flColorBrightness, 1.0, smoothstep(0.0, 0.00999999977648258209228515625, _21647) * (1.0 - (smoothstep(0.5, 0.60000002384185791015625, _22743.w) * smoothstep(1.0, 0.89999997615814208984375, _22743.w)))));
        vec3 _21104 = _19616.xyz * _16529.xyz;
        vec3 _21271 = normalize(max(vec3(0.0003000000142492353916168212890625), _21104.xyz));
        vec3 _23898 = mix(_Globals_.g_vPaintAlbedoLevels.xyz, _Globals_.g_vMetallicPaintAlbedoLevels.xyz, vec3(_10247));
        _22401 = vec4(mix(mix(_21104, ((_21271.xyz * mix(min(_23898.x, dot(_19616.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _23898.z, saturate(pow(max(_21104.x, max(_21104.y, _21104.z)), _23898.y)))) / vec3(max(_21271.x, max(_21271.y, _21271.z)))).xyz, vec3(_Globals_.g_flWearAmount)), _22737, _24345), 1.0);
    }
    else
    {
        _22401 = _11711;
    }
    vec4 _3401 = texture(sampler2D(g_tGlitterNormal, g_sTrilinearWrap), input_1.xy);
    vec4 _6805;
    if (_3401.w < 0.0)
    {
        vec4 _23135 = _22401;
        _23135.x = _3401.x;
        _23135.y = _3401.y;
        _23135.z = _3401.z;
        _6805 = _23135;
    }
    else
    {
        _6805 = _22401;
    }
    output_0 = _6805;
}


