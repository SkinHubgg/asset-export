// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 0 (name: g_vPatternTexCoordXform0) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (22536 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=2, S_USE_ALL_MASKS, S_SEPARATE_CHANNEL_INPUTS

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

const vec2 _74[17] = vec2[](vec2(-0.00107233994640409946441650390625, -0.004002030007541179656982421875), vec2(0.001953119994141161441802978515625, -0.0033829100430011749267578125), vec2(0.004002030007541179656982421875, -0.00107233994640409946441650390625), vec2(-0.00071489601396024227142333984375, -0.00266802008263766765594482421875), vec2(0.000976564944721758365631103515625, -0.001691460027359426021575927734375), vec2(0.00266802008263766765594482421875, -0.00071489601396024227142333984375), vec2(-0.0033829100430011749267578125, -0.001953119994141161441802978515625), vec2(-0.001691460027359426021575927734375, -0.000976564944721758365631103515625), vec2(0.0), vec2(0.001691460027359426021575927734375, 0.000976564944721758365631103515625), vec2(0.0033829100430011749267578125, 0.001953119994141161441802978515625), vec2(-0.00266802008263766765594482421875, 0.00071489601396024227142333984375), vec2(-0.000976564944721758365631103515625, 0.001691460027359426021575927734375), vec2(0.00071489601396024227142333984375, 0.00266802008263766765594482421875), vec2(-0.004002030007541179656982421875, 0.00107233994640409946441650390625), vec2(-0.001953119994141161441802978515625, 0.0033829100430011749267578125), vec2(0.00107233994640409946441650390625, 0.0040020202286541461944580078125));
vec4 _2;

struct _1287
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
    int g_bRoughnessPerColor;
    vec4 g_vPaintRoughness;
    float g_flPearlescentScale;
    vec4 g_vPaintMetalness;
    float g_flWearAmount;
    int g_bBiasSpray;
    vec3 g_vSprayBiasBlend;
    float g_fHalftoneCavityCutoff;
    vec3 g_vHalftonePatternLevels;
    vec2 g_vHalftoneThresholds;
    int g_bHalftoneInCavity;
    vec3 g_vPaintAlbedoLevels;
    vec3 g_vMetallicPaintAlbedoLevels;
};

layout(set = 1) uniform _1287 _Globals_;

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
    vec4 _18087 = texture(sampler2D(g_tAmbientOcclusion, g_sTrilinearClamp), input_1.xy);
    float _4306 = pow(_18087.x, 1.5) * 0.959999978542327880859375;
    float _5542 = _18087.y;
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
        _19130 = _13155 + (texture(sampler2D(g_tPosition, g_sTrilinearClamp), (input_1.xy + (_74[_16208] * 0.20000000298023223876953125)).xy) * 0.0588235296308994293212890625);
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
    vec4 _21760 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
    bool _14875 = _Globals_.g_bBiasSpray != 0;
    vec4 _20826;
    SPIRV_CROSS_BRANCH
    if (_14875)
    {
        vec3 _23972 = _21760.xyz;
        vec3 _22672 = _23972 * 12.9200000762939453125;
        vec3 _7485 = (pow(_23972, vec3(0.4166666567325592041015625)) * 1.05499994754791259765625) - vec3(0.054999999701976776123046875);
        float _21354;
        if (_21760.x <= 0.003130800090730190277099609375)
        {
            _21354 = _22672.x;
        }
        else
        {
            _21354 = _7485.x;
        }
        float _21355;
        if (_21760.y <= 0.003130800090730190277099609375)
        {
            _21355 = _22672.y;
        }
        else
        {
            _21355 = _7485.y;
        }
        float _19167;
        if (_21760.z <= 0.003130800090730190277099609375)
        {
            _19167 = _22672.z;
        }
        else
        {
            _19167 = _7485.z;
        }
        vec4 _16668;
        _16668.x = _21354;
        _16668.y = _21355;
        _16668.z = _19167;
        _20826 = _16668;
    }
    else
    {
        _20826 = _21760;
    }
    vec3 _6906 = normalize((_20826.xyz * 2.0) - vec3(1.0));
    vec4 _19680 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yz, _Globals_.g_vPatternTexCoordXform0.xy) + _Globals_.g_vPatternTexCoordXform0.w, dot(_18941.yz, _Globals_.g_vPatternTexCoordXform1.xy) + _Globals_.g_vPatternTexCoordXform1.w));
    vec4 _19681 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.xz, _Globals_.g_vPatternTexCoordXform0.xy) + _Globals_.g_vPatternTexCoordXform0.w, dot(_18941.xz, _Globals_.g_vPatternTexCoordXform1.xy) + _Globals_.g_vPatternTexCoordXform1.w));
    vec4 _19718 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yx, _Globals_.g_vPatternTexCoordXform0.xy) + _Globals_.g_vPatternTexCoordXform0.w, dot(_18941.yx, _Globals_.g_vPatternTexCoordXform1.xy) + _Globals_.g_vPatternTexCoordXform1.w));
    vec4 _17673 = mix(mix(_19680.xyzw, _19681.xyzw, vec4(_Globals_.g_vSprayBiasBlend.y * pow(abs(_6906.y), 7.0))), _19718.xyzw, vec4(_Globals_.g_vSprayBiasBlend.z * pow(abs(_6906.z), 7.0)));
    vec4 _11692;
    SPIRV_CROSS_BRANCH
    if (_14874)
    {
        vec4 _12936 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
        vec4 _20827;
        SPIRV_CROSS_BRANCH
        if (_14875)
        {
            vec3 _23973 = _12936.xyz;
            vec3 _22673 = _23973 * 12.9200000762939453125;
            vec3 _7486 = (pow(_23973, vec3(0.4166666567325592041015625)) * 1.05499994754791259765625) - vec3(0.054999999701976776123046875);
            float _21356;
            if (_12936.x <= 0.003130800090730190277099609375)
            {
                _21356 = _22673.x;
            }
            else
            {
                _21356 = _7486.x;
            }
            float _21357;
            if (_12936.y <= 0.003130800090730190277099609375)
            {
                _21357 = _22673.y;
            }
            else
            {
                _21357 = _7486.y;
            }
            float _19168;
            if (_12936.z <= 0.003130800090730190277099609375)
            {
                _19168 = _22673.z;
            }
            else
            {
                _19168 = _7486.z;
            }
            vec4 _16671;
            _16671.x = _21356;
            _16671.y = _21357;
            _16671.z = _19168;
            _20827 = _16671;
        }
        else
        {
            _20827 = _12936;
        }
        vec3 _8217 = normalize((_20827.xyz * 2.0) - vec3(1.0));
        vec4 _20991 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneA0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA0.w, dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneA1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA1.w));
        vec4 _20992 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneA0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA0.w, dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneA1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA1.w));
        vec4 _19719 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneA0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA0.w, dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneA1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneA1.w));
        vec4 _12937 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
        vec4 _20828;
        SPIRV_CROSS_BRANCH
        if (_14875)
        {
            vec3 _23974 = _12937.xyz;
            vec3 _22674 = _23974 * 12.9200000762939453125;
            vec3 _7487 = (pow(_23974, vec3(0.4166666567325592041015625)) * 1.05499994754791259765625) - vec3(0.054999999701976776123046875);
            float _21358;
            if (_12937.x <= 0.003130800090730190277099609375)
            {
                _21358 = _22674.x;
            }
            else
            {
                _21358 = _7487.x;
            }
            float _21359;
            if (_12937.y <= 0.003130800090730190277099609375)
            {
                _21359 = _22674.y;
            }
            else
            {
                _21359 = _7487.y;
            }
            float _19169;
            if (_12937.z <= 0.003130800090730190277099609375)
            {
                _19169 = _22674.z;
            }
            else
            {
                _19169 = _7487.z;
            }
            vec4 _16673;
            _16673.x = _21358;
            _16673.y = _21359;
            _16673.z = _19169;
            _20828 = _16673;
        }
        else
        {
            _20828 = _12937;
        }
        vec3 _8218 = normalize((_20828.xyz * 2.0) - vec3(1.0));
        vec4 _20993 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneB0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB0.w, dot(_18941.yz, _Globals_.g_vPatternTexCoordXformHalftoneB1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB1.w));
        vec4 _20994 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneB0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB0.w, dot(_18941.xz, _Globals_.g_vPatternTexCoordXformHalftoneB1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB1.w));
        vec4 _19720 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), vec2(dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneB0.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB0.w, dot(_18941.yx, _Globals_.g_vPatternTexCoordXformHalftoneB1.xy) + _Globals_.g_vPatternTexCoordXformHalftoneB1.w));
        vec4 _12938 = texture(sampler2D(g_tSurface, g_sTrilinearClamp), input_1.xy);
        vec4 _20829;
        SPIRV_CROSS_BRANCH
        if (_14875)
        {
            vec3 _23975 = _12938.xyz;
            vec3 _22675 = _23975 * 12.9200000762939453125;
            vec3 _7488 = (pow(_23975, vec3(0.4166666567325592041015625)) * 1.05499994754791259765625) - vec3(0.054999999701976776123046875);
            float _21360;
            if (_12938.x <= 0.003130800090730190277099609375)
            {
                _21360 = _22675.x;
            }
            else
            {
                _21360 = _7488.x;
            }
            float _21361;
            if (_12938.y <= 0.003130800090730190277099609375)
            {
                _21361 = _22675.y;
            }
            else
            {
                _21361 = _7488.y;
            }
            float _19170;
            if (_12938.z <= 0.003130800090730190277099609375)
            {
                _19170 = _22675.z;
            }
            else
            {
                _19170 = _7488.z;
            }
            vec4 _16675;
            _16675.x = _21360;
            _16675.y = _21361;
            _16675.z = _19170;
            _20829 = _16675;
        }
        else
        {
            _20829 = _12938;
        }
        vec3 _8219 = normalize((_20829.xyz * 2.0) - vec3(1.0));
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
        _11692 = _15713;
    }
    else
    {
        _11692 = _17673;
    }
    float _10030 = _12552.y;
    float _11018 = _12552.z;
    float _8103 = mix(mix(mix(mix(mix(_Globals_.g_vPaintDurability.x, _Globals_.g_vPaintDurability.y, _11692.x), _Globals_.g_vPaintDurability.z, _11692.y), _Globals_.g_vPaintDurability.w, _11692.z), _Globals_.g_vPaintDurability.z, _10030), _Globals_.g_vPaintDurability.w, _11018);
    float _5486 = ((_18087.w + (_19068.x * mix(smoothstep(0.0, 0.680000007152557373046875, pow(_4306, 1.10000002384185791015625)), smoothstep(0.0, 0.5099999904632568359375, pow(_4306, 0.800000011920928955078125)), pow(_Globals_.g_flWearAmount, 0.300000011920928955078125)))) * ((_Globals_.g_flWearAmount * 6.0) + 1.0)) * _8103;
    float _4693 = _Globals_.g_fWearSoftness * _8103;
    float _25193 = 0.560000002384185791015625 - (0.0599999986588954925537109375 * _Globals_.g_flWearAmount);
    float _17192 = 0.540000021457672119140625 - (_Globals_.g_flWearAmount * 0.119999997317790985107421875);
    vec3 _21103 = _11692.xyz * vec3(smoothstep(0.579999983310699462890625 + _4693, _25193 - _4693, _5486), smoothstep(_25193 + _4693, _17192 - _4693, _5486), smoothstep(_17192 + _4693, (0.519999980926513671875 - (_Globals_.g_flWearAmount * 0.17999999225139617919921875)) - _4693, _5486)).xyz;
    float _12931 = _21103.x;
    float _13767 = _21103.y;
    float _14497 = _21103.z;
    float _20939 = smoothstep(0.560000002384185791015625 - _4693, 0.7400000095367431640625 + _4693, _5486);
    vec4 _9437 = texture(sampler2D(g_tGrunge, g_sTrilinearWrap), input_2.zw);
    vec4 _16529 = mix(vec4(1.0), _9437, vec4((pow(1.0 - _4306, 4.0) * 0.25) + (0.75 * _Globals_.g_flWearAmount)));
    float _22165 = mix(mix(mix(mix(mix(_Globals_.g_vPaintMetalness.x, _Globals_.g_vPaintMetalness.y, _12931), _Globals_.g_vPaintMetalness.z, _13767), _Globals_.g_vPaintMetalness.w, _14497), _Globals_.g_vPaintMetalness.z, _10030), _Globals_.g_vPaintMetalness.w, _11018);
    vec4 _7078;
    if (_Globals_.bRoughnessMode != 0)
    {
        vec4 _19391 = texture(sampler2D(g_tMetalness, g_sTrilinearClamp), input_1.xy);
        _19391.x = _19391.x;
        bool _14878 = _Globals_.g_bRoughnessPerColor != 0;
        float _12885;
        SPIRV_CROSS_BRANCH
        if (_14878)
        {
            _12885 = mix(mix(mix(_Globals_.g_vPaintRoughness.x, _Globals_.g_vPaintRoughness.y, _12931), _Globals_.g_vPaintRoughness.z, _13767), _Globals_.g_vPaintRoughness.w, _14497);
        }
        else
        {
            _12885 = _Globals_.g_flPaintRoughness;
        }
        float _20271;
        SPIRV_CROSS_BRANCH
        if (_14878)
        {
            _20271 = mix(mix(_12885, _Globals_.g_vPaintRoughness.z, _10030), _Globals_.g_vPaintRoughness.w, _11018);
        }
        else
        {
            _20271 = _12885;
        }
        vec4 _14119 = mix(vec4(min(1.0, _20271 + ((((1.0 - _16529.w) * _Globals_.g_flWearAmount) * _Globals_.g_flWearAmount) * 0.5)), _22165, 0.0, 1.0), _19391, vec4(_20939));
        float _10938 = 1.0 - _20939;
        vec4 _13018 = _14119;
        _13018.z = _10938;
        vec3 _18043 = _13018.xyz * vec3(0.077399380505084991455078125);
        vec3 _7676 = pow((_13018.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _21362;
        if (_14119.x <= 0.040449999272823333740234375)
        {
            _21362 = _18043.x;
        }
        else
        {
            _21362 = _7676.x;
        }
        float _23035;
        if (_14119.y <= 0.040449999272823333740234375)
        {
            _23035 = _18043.y;
        }
        else
        {
            _23035 = _7676.y;
        }
        float _19513;
        if (_10938 <= 0.040449999272823333740234375)
        {
            _19513 = _18043.z;
        }
        else
        {
            _19513 = _7676.z;
        }
        vec4 _17156 = vec4(_21362, _23035, _10938, min(1.0, _Globals_.g_flPearlescentScale));
        _17156.z = _19513;
        _7078 = _17156;
    }
    else
    {
        _7078 = vec4(input_1.xy, 0.0, 1.0);
    }
    vec4 _22401;
    if (_Globals_.bRoughnessMode == 0)
    {
        vec3 _19616 = saturate(mix(mix(mix(mix(mix(_Globals_.g_vColor0, _Globals_.g_vColor1, vec3(_12931)), _Globals_.g_vColor2, vec3(_13767)), _Globals_.g_vColor3, vec3(_14497)), _Globals_.g_vColor2, vec3(_10030)), _Globals_.g_vColor3, vec3(_11018)) * mix(_Globals_.g_flColorBrightness, 1.0, smoothstep(0.5299999713897705078125 - _4693, 0.7200000286102294921875 + _4693, _5486) * (1.0 - (smoothstep(0.5, 0.60000002384185791015625, _11692.w) * smoothstep(1.0, 0.89999997615814208984375, _11692.w)))));
        vec3 _21104 = _19616.xyz * _16529.xyz;
        vec3 _21271 = normalize(max(vec3(0.0003000000142492353916168212890625), _21104.xyz));
        vec3 _23898 = mix(_Globals_.g_vPaintAlbedoLevels.xyz, _Globals_.g_vMetallicPaintAlbedoLevels.xyz, vec3(_22165));
        vec3 _25172 = mix(mix(_21104, ((_21271.xyz * mix(min(_23898.x, dot(_19616.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _23898.z, saturate(pow(max(_21104.x, max(_21104.y, _21104.z)), _23898.y)))) / vec3(max(_21271.x, max(_21271.y, _21271.z)))).xyz, vec3(_Globals_.g_flWearAmount)), texture(sampler2D(g_tColor, g_sTrilinearClamp), input_1.xy).xyz, vec3(_20939));
        _22401 = vec4(_25172, 1.0);
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


