// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 4 (name: g_vColor2) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (9500 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_PAINT_STYLE=8

#version 460

vec4 _2;

struct _2210
{
    int bRoughnessMode;
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
    vec3 g_vPaintAlbedoLevels;
    vec3 g_vMetallicPaintAlbedoLevels;
};

layout(set = 1) uniform _2210 _Globals_;

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
    vec4 _19372 = texture(sampler2D(g_tAmbientOcclusion, g_sTrilinearClamp), input_1.xy);
    float _4306 = _19372.x;
    float _5542 = _19372.y;
    vec4 _19373 = texture(sampler2D(g_tMasks, g_sTrilinearClamp), input_1.xy);
    float _17150 = _19373.x;
    float _13255 = 1.0 - _17150;
    vec4 _19334 = texture(sampler2D(g_tWear, g_sTrilinearWrap), input_2.xy);
    float _5744 = _19334.x;
    vec4 _11288 = texture(sampler2D(g_tPattern, AddressU_dynamic_AddressV_dynamic), input_1.zw);
    float _19155 = _11288.w;
    float _17710 = max(0.0, smoothstep(0.0, 0.5, _19155));
    float _10193 = (((min(_19372.w, _13255) + (_5744 * _4306)) * ((_Globals_.g_flWearAmount * 6.0) + 1.0)) + (smoothstep(0.5, 0.60000002384185791015625, _19155) * smoothstep(1.0, 0.89999997615814208984375, _19155))) * _17710;
    float _4693 = _Globals_.g_fWearSoftness * _17710;
    bool _18318 = _17150 > 0.9900000095367431640625;
    float _6760 = mix(smoothstep(0.579999983310699462890625 - _4693, 0.680000007152557373046875 + _4693, _10193), _10193, float(_18318));
    vec4 _19374 = texture(sampler2D(g_tGrunge, g_sTrilinearWrap), input_2.zw);
    vec4 _25204 = mix(vec4(1.0), _19374, vec4((pow(1.0 - _4306, 4.0) * 0.25) + (0.75 * _Globals_.g_flWearAmount)));
    float _8353 = smoothstep(0.100000001490116119384765625, 0.20000000298023223876953125, ((_5744 * _5542) * (_4306 * _4306)) * _Globals_.g_flWearAmount);
    float _24589 = smoothstep(0.0, 0.1500000059604644775390625, (saturate((_4306 * _5542) - (_Globals_.g_flWearAmount * 0.100000001490116119384765625)) - (saturate((_19374.x * _19374.y) * _19374.z) * 0.23000000417232513427734375)) + 0.07999999821186065673828125);
    float _10247;
    vec4 _11711;
    if (_Globals_.bRoughnessMode != 0)
    {
        vec4 _20322 = texture(sampler2D(g_tMetalness, g_sTrilinearClamp), input_1.xy);
        float _7959 = 1.0 - _6760;
        float _24500 = 1.0 - min(1.0, _19155 * 2.0);
        float _9781 = dot(_25204.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
        float _23988 = _25204.w;
        float _19555 = (1.0 - _23988) * _Globals_.g_flWearAmount;
        float _20709 = saturate((((mix(_Globals_.g_flPaintRoughness, mix(((_24500 * _24500) * 0.85000002384185791015625) + 0.1500000059604644775390625, _Globals_.g_flPaintRoughness, float(_19155 >= 0.5)), _17150) * mix(1.0, 0.89999997615814208984375, _8353)) + (((1.0 - _9781) * _Globals_.g_flWearAmount) * 0.0500000007450580596923828125)) + (((1.0 - _24589) * 0.1500000059604644775390625) * _Globals_.g_flWearAmount)) + (_19555 * 0.1500000059604644775390625));
        float _23115 = mix(mix(1.0, pow((_24589 * _23988) * _9781, 0.5), _Globals_.g_flWearAmount), 1.0, _8353);
        vec4 _13436;
        _13436.x = mix(_20322.x, mix(min(1.0, _20709 + ((_19555 * _Globals_.g_flWearAmount) * 0.5)), _20709, _17150), _18318 ? 1.0 : max(0.0, _7959));
        _13436.y = mix(mix(_Globals_.g_flPaintMetalness, _20322.y, _6760), _23115, _17150);
        _13436.z = _7959;
        vec4 _21709;
        if (_Globals_.g_bPearlescentOnMetallicOnly != 0)
        {
            vec4 _21219 = _13436;
            _21219.z = _7959 * _17150;
            _21709 = _21219;
        }
        else
        {
            _21709 = _13436;
        }
        vec3 _18043 = _21709.xyz * vec3(0.077399380505084991455078125);
        vec3 _7676 = pow((_21709.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _21354;
        if (_21709.x <= 0.040449999272823333740234375)
        {
            _21354 = _18043.x;
        }
        else
        {
            _21354 = _7676.x;
        }
        float _21355;
        if (_21709.y <= 0.040449999272823333740234375)
        {
            _21355 = _18043.y;
        }
        else
        {
            _21355 = _7676.y;
        }
        float _22686;
        if (_21709.z <= 0.040449999272823333740234375)
        {
            _22686 = _18043.z;
        }
        else
        {
            _22686 = _7676.z;
        }
        _11711 = vec4(_21354, _21355, _22686, min(1.0, _Globals_.g_flPearlescentScale));
        _10247 = _23115;
    }
    else
    {
        _11711 = vec4(input_1.xy, 0.0, 1.0);
        _10247 = 1.0;
    }
    vec4 _22401;
    if (_Globals_.bRoughnessMode == 0)
    {
        vec3 _22868 = vec3(_Globals_.g_flWearAmount);
        vec3 _21096 = _11288.xyz;
        vec3 _15472 = mix(_21096, _21096 * _Globals_.g_flColorBrightness, vec3(max(_17150, float(_Globals_.g_nColorAdjustmentMode))));
        vec4 _17842;
        _17842.x = _15472.x;
        _17842.y = _15472.y;
        _17842.z = _15472.z;
        vec3 _15176 = vec3(_17150);
        vec3 _21103 = mix(_17842.xyz, mix(mix(mix(_Globals_.g_vColor1, _Globals_.g_vColor3, vec3(pow(_Globals_.g_flWearAmount, 0.5))), mix(_Globals_.g_vColor1, _Globals_.g_vColor2, _22868), vec3(_24589)) * _17842.xyz, _Globals_.g_vColor0 * dot(_17842.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), vec3(_8353)), _15176).xyz * _25204.xyz;
        vec3 _21271 = normalize(max(vec3(0.0003000000142492353916168212890625), _21103.xyz));
        vec3 _23898 = mix(_Globals_.g_vPaintAlbedoLevels.xyz, _Globals_.g_vMetallicPaintAlbedoLevels.xyz, vec3(mix(_Globals_.g_flPaintMetalness, _10247, _17150)));
        _22401 = vec4(mix(mix(_21103, ((_21271.xyz * mix(min(_23898.x, dot(mix(_17842.xyz, _17842.xyz * _Globals_.g_vColor1, _15176).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _23898.z, saturate(pow(max(_21103.x, max(_21103.y, _21103.z)), _23898.y)))) / vec3(max(_21271.x, max(_21271.y, _21271.z)))).xyz, _22868), texture(sampler2D(g_tColor, g_sTrilinearClamp), input_1.xy).xyz, vec3(_6760 * _13255)), 1.0);
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


