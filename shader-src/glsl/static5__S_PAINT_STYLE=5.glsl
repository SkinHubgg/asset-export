// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 0 (name: g_vPatternTexCoordXform0) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (17588 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=5

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

const vec2 _2942[17] = vec2[](vec2(-0.00107233994640409946441650390625, -0.004002030007541179656982421875), vec2(0.001953119994141161441802978515625, -0.0033829100430011749267578125), vec2(0.004002030007541179656982421875, -0.00107233994640409946441650390625), vec2(-0.00071489601396024227142333984375, -0.00266802008263766765594482421875), vec2(0.000976564944721758365631103515625, -0.001691460027359426021575927734375), vec2(0.00266802008263766765594482421875, -0.00071489601396024227142333984375), vec2(-0.0033829100430011749267578125, -0.001953119994141161441802978515625), vec2(-0.001691460027359426021575927734375, -0.000976564944721758365631103515625), vec2(0.0), vec2(0.001691460027359426021575927734375, 0.000976564944721758365631103515625), vec2(0.0033829100430011749267578125, 0.001953119994141161441802978515625), vec2(-0.00266802008263766765594482421875, 0.00071489601396024227142333984375), vec2(-0.000976564944721758365631103515625, 0.001691460027359426021575927734375), vec2(0.00071489601396024227142333984375, 0.00266802008263766765594482421875), vec2(-0.004002030007541179656982421875, 0.00107233994640409946441650390625), vec2(-0.001953119994141161441802978515625, 0.0033829100430011749267578125), vec2(0.00107233994640409946441650390625, 0.0040020202286541461944580078125));
vec4 _2;

struct _2385
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
    float g_fWearSoftness;
    vec3 g_vColor0;
    vec3 g_vColor1;
    vec3 g_vColor2;
    vec3 g_vColor3;
    float g_flColorBrightness;
    vec4 g_vPaintDurability;
    float g_flPaintRoughness;
    float g_flPearlescentScale;
    float g_flWearAmount;
    vec3 g_vSprayBiasBlend;
    float g_fHalftoneCavityCutoff;
    vec3 g_vHalftonePatternLevels;
    vec2 g_vHalftoneThresholds;
    int g_bHalftoneInCavity;
    vec3 g_vMetallicPaintAlbedoLevels;
};

layout(set = 1) uniform _2385 _Globals_;

layout(set = 1, binding = 30) uniform texture2D g_tAmbientOcclusion;
layout(set = 1, binding = 23) uniform sampler g_sTrilinearClamp;
layout(set = 1, binding = 31) uniform texture2D g_tMasks;
layout(set = 1, binding = 33) uniform texture2D g_tPosition;
layout(set = 1, binding = 38) uniform texture2D g_tWear;
layout(set = 1, binding = 22) uniform sampler g_sTrilinearWrap;
layout(set = 1, binding = 27) uniform sampler AddressU_dynamic_AddressV_dynamic;
layout(set = 1, binding = 32) uniform texture2D g_tSurface;
layout(set = 1, binding = 37) uniform texture2D g_tPattern;
layout(set = 1, binding = 39) uniform texture2D g_tGrunge;
layout(set = 1, binding = 35) uniform texture2D g_tMetalness;
layout(set = 1, binding = 34) uniform texture2D g_tColor;
layout(set = 1, binding = 36) uniform texture2D g_tGlitterNormal;

layout(location = 1) in vec4 input_1;
layout(location = 2) in vec4 input_2;
layout(location = 0) out vec4 output_0;

void main()
{
    vec4 _19372 = texture(sampler2D(g_tAmbientOcclusion, g_sTrilinearClamp), input_1.xy);
    float _4306 = _19372.x;
    float _5542 = _19372.y;
    vec4 _12552 = texture(sampler2D(g_tMasks, g_sTrilinearClamp), input_1.xy);
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
        _19130 = _13155 + (texture(sampler2D(g_tPosition, g_sTrilinearClamp), (input_1.xy + (_2942[_16208] * 0.20000000298023223876953125)).xy) * 0.0588235296308994293212890625);
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
    vec4 _11237;
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
        _11237 = _15713;
    }
    else
    {
        _11237 = _17673;
    }
    float _10030 = _12552.y;
    float _11018 = _12552.z;
    float _8103 = mix(mix(mix(mix(mix(_Globals_.g_vPaintDurability.x, _Globals_.g_vPaintDurability.y, _11237.x), _Globals_.g_vPaintDurability.z, _11237.y), _Globals_.g_vPaintDurability.w, _11237.z), _Globals_.g_vPaintDurability.z, _10030), _Globals_.g_vPaintDurability.w, _11018);
    float _4693 = _Globals_.g_fWearSoftness * _8103;
    float _21647 = smoothstep(0.579999983310699462890625 - _4693, 0.680000007152557373046875 + _4693, ((_19372.w + (_19068.x * _4306)) * ((_Globals_.g_flWearAmount * 6.0) + 1.0)) * _8103);
    float _12663 = _12552.x;
    float _15212 = max(1.0 - _12663, _21647);
    float _4518 = (smoothstep(0.0, 0.00999999977648258209228515625, _21647) * (1.0 - (smoothstep(0.5, 0.60000002384185791015625, _11237.w) * smoothstep(1.0, 0.89999997615814208984375, _11237.w)))) * _12663;
    vec4 _9437 = texture(sampler2D(g_tGrunge, g_sTrilinearWrap), input_2.zw);
    vec4 _16529 = mix(vec4(1.0), _9437, vec4((pow(1.0 - _4306, 4.0) * 0.25) + (0.75 * _Globals_.g_flWearAmount)));
    vec4 _7078;
    if (_Globals_.bRoughnessMode != 0)
    {
        vec4 _20322 = texture(sampler2D(g_tMetalness, g_sTrilinearClamp), input_1.xy);
        float _24771 = 1.0 - _15212;
        float _22406 = mix(_20322.x, min(1.0, mix(mix(_Globals_.g_flPaintRoughness, _Globals_.g_flPaintRoughness, max(max(_10030, _11018), _15212)), 0.3499999940395355224609375, _4518) + ((1.0 - dot(_16529.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) * 0.20000000298023223876953125)), max(0.0, _24771));
        float _7177 = mix(_12663, _20322.y, _15212);
        vec4 _6640 = vec4(_22406, _7177, _24771, min(1.0, _Globals_.g_flPearlescentScale));
        vec3 _21659 = _6640.xyz;
        vec3 _10597 = _21659 * vec3(0.077399380505084991455078125);
        vec3 _9357 = pow((_21659 * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _23035;
        if (_22406 <= 0.040449999272823333740234375)
        {
            _23035 = _10597.x;
        }
        else
        {
            _23035 = _9357.x;
        }
        float _23036;
        if (_7177 <= 0.040449999272823333740234375)
        {
            _23036 = _10597.y;
        }
        else
        {
            _23036 = _9357.y;
        }
        float _19167;
        if (_24771 <= 0.040449999272823333740234375)
        {
            _19167 = _10597.z;
        }
        else
        {
            _19167 = _9357.z;
        }
        _6640.x = _23035;
        _6640.y = _23036;
        _6640.z = _19167;
        _7078 = _6640;
    }
    else
    {
        _7078 = vec4(input_1.xy, 0.0, 1.0);
    }
    vec4 _22401;
    if (_Globals_.bRoughnessMode == 0)
    {
        vec3 _18216 = texture(sampler2D(g_tColor, g_sTrilinearClamp), input_1.xy).xyz;
        vec3 _13884 = vec3(_4518);
        float _20005 = mix(_Globals_.g_flColorBrightness, 1.0, _4518);
        vec3 _14061 = saturate(saturate(mix(mix(_18216, mix(mix(mix(mix(mix(_Globals_.g_vColor0, _Globals_.g_vColor1, vec3(_11237.x)), _Globals_.g_vColor2, vec3(_11237.y)), _Globals_.g_vColor3, vec3(_11237.z)), _Globals_.g_vColor2, vec3(_10030)), _Globals_.g_vColor3, vec3(_11018)).xyz, vec3(_12663)), vec3(0.37999999523162841796875, 0.37000000476837158203125, 0.3499999940395355224609375), _13884) * _20005) * _20005);
        vec3 _20049 = mix(_16529.xyz, vec3(1.0), _13884);
        vec4 _17842;
        _17842.x = _20049.x;
        _17842.y = _20049.y;
        _17842.z = _20049.z;
        vec3 _21103 = _14061.xyz * _17842.xyz;
        vec3 _21271 = normalize(max(vec3(0.0003000000142492353916168212890625), _21103.xyz));
        _22401 = vec4(mix(mix(_21103, ((_21271.xyz * mix(min(_Globals_.g_vMetallicPaintAlbedoLevels.x, dot(_14061.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _Globals_.g_vMetallicPaintAlbedoLevels.z, saturate(pow(max(_21103.x, max(_21103.y, _21103.z)), _Globals_.g_vMetallicPaintAlbedoLevels.y)))) / vec3(max(_21271.x, max(_21271.y, _21271.z)))).xyz, vec3(_Globals_.g_flWearAmount)), _18216, vec3(_15212)), 1.0);
    }
    else
    {
        _22401 = _7078;
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


