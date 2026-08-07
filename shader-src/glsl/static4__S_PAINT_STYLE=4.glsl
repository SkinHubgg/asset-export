// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 4 (name: g_vColor2) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (8356 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=4

#version 460

vec4 _2;

struct _1952
{
    int bRoughnessMode;
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
    vec3 g_vMetallicPaintAlbedoLevels;
};

layout(set = 1) uniform _1952 _Globals_;

layout(set = 1, binding = 30) uniform texture2D g_tAmbientOcclusion;
layout(set = 1, binding = 23) uniform sampler g_sTrilinearClamp;
layout(set = 1, binding = 31) uniform texture2D g_tMasks;
layout(set = 1, binding = 38) uniform texture2D g_tWear;
layout(set = 1, binding = 22) uniform sampler g_sTrilinearWrap;
layout(set = 1, binding = 37) uniform texture2D g_tPattern;
layout(set = 1, binding = 27) uniform sampler AddressU_dynamic_AddressV_dynamic;
layout(set = 1, binding = 39) uniform texture2D g_tGrunge;
layout(set = 1, binding = 35) uniform texture2D g_tMetalness;
layout(set = 1, binding = 34) uniform texture2D g_tColor;
layout(set = 1, binding = 36) uniform texture2D g_tGlitterNormal;

layout(location = 1) in vec4 input_1;
layout(location = 2) in vec4 input_2;
layout(location = 0) out vec4 output_0;

void main()
{
    vec4 _18992 = texture(sampler2D(g_tAmbientOcclusion, g_sTrilinearClamp), input_1.xy);
    float _4306 = _18992.x;
    vec4 _18993 = texture(sampler2D(g_tMasks, g_sTrilinearClamp), input_1.xy);
    vec4 _19334 = texture(sampler2D(g_tWear, g_sTrilinearWrap), input_2.xy);
    vec4 _11288 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), input_1.zw);
    float _19155 = _11288.w;
    float _23477 = smoothstep(0.5, 0.60000002384185791015625, _19155) * smoothstep(1.0, 0.89999997615814208984375, _19155);
    float _7656 = _11288.x;
    float _11437 = _11288.y;
    float _11438 = _11288.z;
    float _10030 = _18993.y;
    float _11018 = _18993.z;
    float _8103 = mix(mix(mix(mix(mix(_Globals_.g_vPaintDurability.x, _Globals_.g_vPaintDurability.y, _7656), _Globals_.g_vPaintDurability.z, _11437), _Globals_.g_vPaintDurability.w, _11438), _Globals_.g_vPaintDurability.z, _10030), _Globals_.g_vPaintDurability.w, _11018);
    float _4693 = _Globals_.g_fWearSoftness * _8103;
    float _22597 = smoothstep(0.579999983310699462890625 - _4693, 0.680000007152557373046875 + _4693, (((_18992.w + (_19334.x * _4306)) * ((_Globals_.g_flWearAmount * 6.0) + 1.0)) + _23477) * _8103);
    float _12663 = _18993.x;
    float _15212 = max(1.0 - _12663, _22597);
    float _4518 = (smoothstep(0.0, 0.00999999977648258209228515625, _22597) * (1.0 - _23477)) * _12663;
    vec4 _9437 = texture(sampler2D(g_tGrunge, g_sTrilinearWrap), input_2.zw);
    vec4 _16529 = mix(vec4(1.0), _9437, vec4((pow(1.0 - _4306, 4.0) * 0.25) + (0.75 * _Globals_.g_flWearAmount)));
    vec4 _7078;
    if (_Globals_.bRoughnessMode != 0)
    {
        vec4 _20322 = texture(sampler2D(g_tMetalness, g_sTrilinearClamp), input_1.xy);
        float _7959 = 1.0 - _15212;
        float _24500 = 1.0 - min(1.0, _19155 * 2.0);
        float _22406 = mix(_20322.x, min(1.0, mix(mix(mix(((_24500 * _24500) * 0.85000002384185791015625) + 0.1500000059604644775390625, _Globals_.g_flPaintRoughness, float(_19155 >= 0.5)), _Globals_.g_flPaintRoughness, max(max(_10030, _11018), _15212)), 0.3499999940395355224609375, _4518) + ((1.0 - dot(_16529.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) * 0.20000000298023223876953125)), max(0.0, _7959));
        float _7177 = mix(_12663, _20322.y, _15212);
        vec4 _6640 = vec4(_22406, _7177, _7959, min(1.0, _Globals_.g_flPearlescentScale));
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
        if (_7959 <= 0.040449999272823333740234375)
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
        vec3 _14061 = saturate(saturate(mix(mix(_18216, mix(mix(mix(mix(mix(_Globals_.g_vColor0, _Globals_.g_vColor1, vec3(_7656 * _12663)), _Globals_.g_vColor2, vec3(_11437 * _12663)), _Globals_.g_vColor3, vec3(_11438 * _12663)), _Globals_.g_vColor2, vec3(_10030)), _Globals_.g_vColor3, vec3(_11018)).xyz, vec3(_12663)), vec3(0.37999999523162841796875, 0.37000000476837158203125, 0.3499999940395355224609375), _13884) * _20005) * _20005);
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


