// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 28 (name: g_vMetalnessRemapRange) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (136080 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_MODE_TOOLS_VIS

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
#extension GL_EXT_samplerless_texture_functions : require
#extension GL_KHR_shader_subgroup_arithmetic : require
layout(early_fragment_tests) in;

struct _1373
{
    vec4 _m0[3];
};

struct _1076
{
    vec4 _m0[4];
};

struct _1753
{
    mat4x3 _m0;
    vec3 _m1;
    uint _m2;
    vec3 _m3;
    uint _m4;
    vec4 _m5;
    vec3 _m6;
    vec4 _m7;
};

struct _918
{
    _1753 _m0[128];
};

struct _1428
{
    mat4 _m0[4];
};

const vec4 _2104[4] = vec4[](vec4(1.0, 0.0, 0.0, 0.0), vec4(0.0, 1.0, 0.0, 0.0), vec4(0.0, 0.0, 1.0, 0.0), vec4(0.0, 0.0, 0.0, 1.0));

struct _200
{
    mat4 _m0;
    mat4 _m1;
    vec4 _m2;
    vec4 _m3;
    vec4 _m4;
    vec4 _m5;
    vec3 _m6;
    uint _m7;
    vec4 _m8;
    vec4 _m9;
    vec4 _m10;
    float _m11;
    float _m12;
    uint _m13;
    int _m14;
    mat4x3 _m15;
    vec4 _m16;
    vec4 _m17;
    vec4 _m18;
    vec4 _m19;
    vec4 _m20;
    vec3 _m21;
    float _m22;
    mat4 _m23;
};

vec4 _4;
vec3 _5;

struct _563
{
    float g_flFogModificationAmount;
    uint g_tColor;
    uint g_tMetalness;
    uint g_sAniso;
    uint g_sBilinearClamp;
    uint g_sTrilinearWrap;
    uint g_sTrilinearClamp;
    uint g_sPointClamp;
    uint g_sUserConfig;
    uint g_sUserConfigAllowGlobalMipBias;
    int g_bDisableNormalMapping;
    int g_bCubemapNormalization;
    int g_bRenderingToCubemaps;
    uint g_sCookieSampler;
    uint g_tShadowDepthBufferCmpSampler;
    int g_nToolsVisMode;
    float g_fToolsVisMaxLightingComplexity;
    float g_fToolsVisMaxHeightRange;
    float g_fToolsVisHeightTint;
    vec4 g_vShaderIDColor;
    vec3 g_vFlatOverlayColor;
    int g_bFogEnabled;
    int g_bDontFlipBackfaceNormals;
    int g_bRenderBackfaceNormals;
    int g_bHighlightDeprecated;
    int g_bIsDeprecated;
    uint g_tNormal;
    uint g_tAmbientOcclusion;
    vec2 g_vMetalnessRemapRange;
    float g_flMetalnessTransitionBias;
    float g_flRainExposureToSkyWetness;
    float g_flRainExposureLocalTimer;
    int bIridescence;
    float g_flIridescentScale;
    float g_flIridescentStrength;
    float g_flIridescentHueShift;
    float g_flSpawnInvulnerability;
    vec3 g_cInvulnerabilityColor;
    vec4 g_vKeychainGhostHandData;
    float g_flPearlescentScale;
};

layout(set = 1) uniform _563 _Globals_;

struct _2962
{
    ivec4 _m0;
    ivec4 _m1;
    ivec4 _m2;
    ivec4 _m3;
    uint _m4;
    uint _m5;
    uint _m6;
    uint _m7;
    uint _m8;
    uint _m9;
    uint _m10;
    uint _m11;
    float _m12;
    float _m13;
    ivec2 _m14;
    mat4 _m15;
    vec2 _m16;
    float _m17;
    vec4 _m18;
    vec4 _m19;
    vec4 _m20;
    vec4 _m21;
    vec4 _m22;
    vec4 _m23;
    mat4 _m24;
    vec4 _m25;
    vec4 _m26;
    vec4 _m27;
    float _m28;
    float _m29;
    float _m30;
    float _m31;
    vec4 _m32;
};

layout(set = 1) uniform _2962 PerViewConstantBufferCsgo_t;

struct _1732
{
    float _m0;
    float _m1;
    vec2 _m2;
    vec2 _m3;
    vec4 _m4;
    float _m5;
    vec4 _m6;
    vec3 _m7;
    vec3 _m8;
};

layout(set = 1) uniform _1732 PerViewConstantBuffer_t;

struct _1780
{
    vec4 _m0;
    vec4 _m1;
    vec4 _m2;
    vec4 _m3;
    vec4 _m4;
    _1373 _m5;
    _1076 _m6;
    vec4 _m7;
    vec4 _m8;
    vec4 _m9;
    uvec4 _m10;
    uvec4 _m11;
    uvec4 _m12;
    vec4 _m13;
    vec4 _m14;
    _918 _m15;
    vec4 _m16;
    vec4 _m17;
    int _m18;
    float _m19;
    vec4 _m20;
    float _m21;
    float _m22;
    float _m23;
    float _m24;
    _1428 _m25;
    _1076 _m26;
    uint _m27;
    uint _m28;
};

layout(set = 3) uniform _1780 PerViewLightingConstantBufferGpu_t;

layout(set = 3, binding = 30, std430) readonly buffer g_CullBits
{
    uint _m0[];
} g_CullBits_1;

layout(set = 3, binding = 31, std430) readonly buffer g_BarnLights
{
    layout(row_major) _200 _m0[];
} g_BarnLights_1;

layout(set = 4, binding = 46) uniform texture2D g_bindless_Texture2D_float4[65536];
layout(set = 4, binding = 29) uniform sampler g_bindless_Sampler[2048];
layout(set = 4, binding = 29) uniform samplerShadow g_bindless_Sampler_1[2048];
layout(set = 4, binding = 46) uniform texture3D g_bindless_Texture3D_float4[65536];
layout(set = 4, binding = 46) uniform texture2DArray g_bindless_Texture2DArray_float4[65536];
layout(set = 4, binding = 46) uniform textureCubeArray g_bindless_TextureCubeArray[65536];
layout(set = 4, binding = 46) uniform textureCube g_bindless_TextureCube_float4[65536];

layout(location = 0) in vec3 input_0;
layout(location = 1) in vec3 input_1;
layout(location = 2) in vec3 input_2;
layout(location = 3) in vec4 input_3;
layout(location = 4) centroid in vec4 input_4;
layout(location = 5) centroid in vec3 input_5;
layout(location = 6) in vec4 input_6;
layout(location = 0) out vec4 output_0;

void main()
{
    vec4 _11408 = gl_FragCoord;
    _11408.w = 1.0 / _11408.w;
    float _12497 = _Globals_.g_flRainExposureToSkyWetness * PerViewConstantBufferCsgo_t._m13;
    bool _15436 = _12497 > 0.0;
    float _13136;
    vec2 _13998;
    float _16305;
    float _17114;
    vec4 _23261;
    if (_15436)
    {
        vec3 _10413 = input_1 + PerViewConstantBufferCsgo_t._m27.xyz;
        vec2 _18197 = input_3.xy * 2.5;
        vec2 _20826;
        if ((length(cross(vec3(dFdx(input_3.xy), 0.0), vec3(dFdy(input_3.xy), 0.0))) / max(9.9999997473787516355514526367188e-05, length(cross(dFdx(_10413), dFdy(_10413))))) < 0.00200000009499490261077880859375)
        {
            _20826 = _18197 * 3.0;
        }
        else
        {
            _20826 = _18197;
        }
        vec4 _20877 = texture(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m11], g_bindless_Sampler[_Globals_.g_sAniso]), (_20826 + (_10413.xy * 9.9999997473787516355514526367188e-05)).xy);
        vec2 _8562 = (_20877.xy * 2.0) - vec2(1.0);
        _8562.y = -_8562.y;
        float _7729 = _20877.w;
        float _12471 = _20877.z + (input_0.x * 0.00999999977648258209228515625);
        float _10538 = saturate((((_12497 * 0.25) - fract(_12471 + (((_Globals_.g_flRainExposureLocalTimer * 0.100000001490116119384765625) * PerViewConstantBufferCsgo_t._m12) * PerViewConstantBufferCsgo_t._m12))) * 5.0) / (PerViewConstantBufferCsgo_t._m13 + 0.001000000047497451305389404296875)) * saturate((input_2.z + 0.75) * 4.0);
        vec2 _13861 = input_3.xy + (((_8562.xy * (-0.0199999995529651641845703125)) * _10538) * _7729);
        vec4 _20488;
        _20488.x = _13861.x;
        _20488.y = _13861.y;
        _13136 = _10538;
        _16305 = _7729;
        _17114 = _12471;
        _13998 = _8562;
        _23261 = _20488;
    }
    else
    {
        _13136 = 0.0;
        _16305 = 0.0;
        _17114 = 0.0;
        _13998 = vec2(0.0);
        _23261 = input_3;
    }
    vec3 _21709;
    if (dot(input_2.xyz, input_2.xyz) >= 1.0099999904632568359375)
    {
        _21709 = input_5.xyz;
    }
    else
    {
        _21709 = input_2.xyz;
    }
    bool _14874 = _Globals_.g_bRenderBackfaceNormals != 0;
    bool _12885;
    if (_14874)
    {
        _12885 = _Globals_.g_bDontFlipBackfaceNormals == 0;
    }
    else
    {
        _12885 = false;
    }
    vec3 _12987;
    SPIRV_CROSS_BRANCH
    if (_12885)
    {
        _12987 = _21709 * (gl_FrontFacing ? 1.0 : (-1.0));
    }
    else
    {
        _12987 = _21709;
    }
    int _15571;
    bool _23067;
    vec3 _17641 = normalize(_12987);
    vec3 _19403 = fwidth(input_2.xyz);
    vec3 _18756 = fwidth(input_1.xyz);
    float _10476 = length(_19403) / length(_18756);
    vec3 _20327 = input_1 + PerViewConstantBufferCsgo_t._m27.xyz;
    vec4 _18011;
    do
    {
        _15571 = _Globals_.g_nToolsVisMode;
        _23067 = _15571 == 11;
        if (_23067)
        {
            uvec2 _7121 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tColor], int(0u)));
            vec2 _11515 = vec2(ivec2(int(_7121.x), int(_7121.y)));
            vec2 _10678 = dFdx(_23261.xy * _11515.x);
            vec2 _10079 = dFdy(_23261.xy * _11515.y);
            _18011 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tColor], g_bindless_Sampler[_Globals_.g_sUserConfigAllowGlobalMipBias]), _23261.xy, max(0.5 * log2(max(dot(_10678, _10678), dot(_10079, _10079))), 5.0));
            break;
        }
        else
        {
            _18011 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tColor], g_bindless_Sampler[_Globals_.g_sUserConfigAllowGlobalMipBias]), _23261.xy);
            break;
        }
        break; // unreachable workaround
    } while(false);
    vec3 _21103 = _18011.xyz * input_4.xyz;
    vec4 _19068 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tAmbientOcclusion], g_bindless_Sampler[_Globals_.g_sUserConfig]), vec2(_23261.xy).xy);
    float _17476 = _19068.x;
    vec4 _21760 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tMetalness], g_bindless_Sampler[_Globals_.g_sUserConfig]), _23261.xy);
    float _20079 = mix(_Globals_.g_vMetalnessRemapRange.x, _Globals_.g_vMetalnessRemapRange.y, _21760.y);
    float _24590 = _21760.z;
    float _6814 = _21760.x;
    vec2 _13746 = vec2(_6814);
    vec4 _19372 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormal], g_bindless_Sampler[_Globals_.g_sUserConfig]), _23261.xy);
    float _16000 = _19372.x;
    float _19720 = _19372.y;
    float _16783 = (_16000 + _19720) - 1.00392162799835205078125;
    float _11176 = _16000 - _19720;
    vec3 _8418 = normalize(vec3(vec2(_16783, _11176), (1.0 - abs(_16783)) - abs(_11176)));
    bool _12886;
    if (_14874)
    {
        _12886 = _Globals_.g_bDontFlipBackfaceNormals == 0;
    }
    else
    {
        _12886 = false;
    }
    bool _24327;
    if (_12886)
    {
        _24327 = !gl_FrontFacing;
    }
    else
    {
        _24327 = false;
    }
    vec3 _12631 = input_2.xyz * (_24327 ? (-1.0) : 1.0);
    float _23240 = (input_6.w > 0.0) ? 1.0 : (-1.0);
    vec3 _14435 = cross(_12631.xyz, input_6.xyz) * _23240;
    bvec4 _24464 = notEqual(PerViewConstantBufferCsgo_t._m3, ivec4(0));
    bool _20058 = _24464.w;
    vec3 _7424;
    if (_20058)
    {
        _7424 = -_14435;
    }
    else
    {
        _7424 = _14435;
    }
    vec3 _20480;
    if (!_24327)
    {
        vec3 _7482 = _8418;
        _7482.y = -_8418.y;
        _20480 = _7482;
    }
    else
    {
        _20480 = _8418;
    }
    vec3 _7054 = normalize((((input_6.xyz * _20480.x).xyz + (_7424.xyz * _20480.y)).xyz + (_12631.xyz * _20480.z)).xyz);
    vec3 _6616;
    vec3 _13137;
    float _13694;
    vec2 _16306;
    vec3 _17115;
    if (_15436)
    {
        float _21270 = saturate((_6814 - 0.75) * 4.0);
        float _8927 = sqrt(1.0 - saturate(dot(_13998.xy, _13998.xy)));
        float _20709 = saturate(_12497);
        float _23650 = (saturate((_13136 * _16305) + (_20709 * 0.5)) * ((_21270 * 0.75) + 0.25)) * _20709;
        float _18483 = _13136 * saturate(1.0 - _21270);
        float _22907 = _18483 * _16305;
        _13137 = mix(_21103, pow(_21103, vec3(1.60000002384185791015625)) * 0.60000002384185791015625, vec3(_23650));
        _16306 = mix(_13746.xy, vec2(0.100000001490116119384765625), vec2(_17476 * saturate(((_22907 * 4.0) + ((((cos((_17114 + (_Globals_.g_flRainExposureLocalTimer * 0.20000000298023223876953125)) * 6.28318500518798828125) * 0.5) + 0.5) * _20709) * 0.20000000298023223876953125)) + (_12497 * 0.4000000059604644775390625))));
        _17115 = mix(normalize(mix(_17641, _7054, vec3(1.0 + (_23650 * 1.5)))), normalize((((input_6.xyz * _13998.x).xyz + (_7424.xyz * _13998.y)).xyz + (_17641.xyz * _8927)).xyz), vec3(_18483));
        _13694 = saturate(_22907 * 2.0);
        _6616 = mix(_20480, vec3(_13998.xy, _8927) * vec3(-1.0, -1.0, 1.0), vec3(_18483 * 0.25));
    }
    else
    {
        _13137 = _21103;
        _16306 = _13746;
        _17115 = vec3(1.0);
        _13694 = 0.0;
        _6616 = _20480;
    }
    vec3 _20195;
    SPIRV_CROSS_BRANCH
    if (_Globals_.g_flPearlescentScale != 0.0)
    {
        float _21433 = (_Globals_.g_flPearlescentScale * (1.0 - dot(normalize(PerViewConstantBuffer_t._m7.xyz - _20327.xyz), _7054))) * _24590;
        float _15271 = cos(_21433);
        float _12935;
        do
        {
            float _18473 = max(_13137.x, max(_13137.y, _13137.z));
            if (_18473 == 0.0)
            {
                _12935 = 0.0;
                break;
            }
            _12935 = (_18473 - min(_13137.x, min(_13137.y, _13137.z))) / _18473;
            break;
        } while(false);
        _20195 = mix(vec3(dot(_13137.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), ((_13137.xyz * _15271) + (cross(vec3(0.57735002040863037109375), _13137.xyz) * sin(_21433))) + ((vec3(0.57735002040863037109375) * dot(vec3(0.57735002040863037109375), _13137.xyz)) * (1.0 - _15271)), vec3(pow(_12935, 0.125)));
    }
    else
    {
        _20195 = _13137;
    }
    vec3 _7866 = _6616;
    _7866.y = -_6616.y;
    bool _12887;
    if (_14874)
    {
        _12887 = _Globals_.g_bDontFlipBackfaceNormals == 0;
    }
    else
    {
        _12887 = false;
    }
    bool _24328;
    if (_12887)
    {
        _24328 = !gl_FrontFacing;
    }
    else
    {
        _24328 = false;
    }
    vec3 _9739 = input_2.xyz * (_24328 ? (-1.0) : 1.0);
    vec3 _24682 = cross(_9739.xyz, input_6.xyz) * _23240;
    vec3 _7425;
    if (_20058)
    {
        _7425 = -_24682;
    }
    else
    {
        _7425 = _24682;
    }
    vec3 _20481;
    if (!_24328)
    {
        vec3 _23482 = _7866;
        _23482.y = _6616.y;
        _20481 = _23482;
    }
    else
    {
        _20481 = _7866;
    }
    vec3 _14786 = normalize((((input_6.xyz * _20481.x).xyz + (_7425.xyz * _20481.y)).xyz + (_9739.xyz * _20481.z)).xyz);
    vec3 _17328 = mix(vec3(0.0199999995529651641845703125), _20195.xyz, vec3(_20079));
    vec3 _22671;
    SPIRV_CROSS_BRANCH
    if (_Globals_.bIridescence != 0)
    {
        vec3 _24006 = normalize(PerViewConstantBuffer_t._m7.xyz - _20327.xyz);
        float _22128 = fract(((dot(_24006, _17641) + dot(_24006, PerViewLightingConstantBufferGpu_t._m16.xyz)) * _Globals_.g_flIridescentScale) + _Globals_.g_flIridescentHueShift) * 6.0;
        float _17518 = floor(_22128);
        float _18832 = _22128 - _17518;
        float _6692 = 1.0 - _18832;
        vec3 _19648;
        if (_17518 == 0.0)
        {
            _19648 = vec3(1.0, _18832, 0.0);
        }
        else
        {
            vec3 _12504;
            if (_17518 == 1.0)
            {
                _12504 = vec3(_6692, 1.0, 0.0);
            }
            else
            {
                vec3 _12503;
                if (_17518 == 2.0)
                {
                    _12503 = vec3(0.0, 1.0, _18832);
                }
                else
                {
                    vec3 _12502;
                    if (_17518 == 3.0)
                    {
                        _12502 = vec3(0.0, _6692, 1.0);
                    }
                    else
                    {
                        vec3 _12501;
                        if (_17518 == 4.0)
                        {
                            _12501 = vec3(_18832, 0.0, 1.0);
                        }
                        else
                        {
                            _12501 = vec3(1.0, 0.0, _6692);
                        }
                        _12502 = _12501;
                    }
                    _12503 = _12502;
                }
                _12504 = _12503;
            }
            _19648 = _12504;
        }
        vec4 _22046 = vec4(_17328.xyz, 1.0);
        float _24323 = dot(_22046.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
        vec3 _9577 = normalize(max(_19648.xyz, vec3(0.001000000047497451305389404296875)));
        _22671 = saturate(mix(_22046.xyz, (_9577 * min(_24323 / dot(_9577.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), (3.0 * _24323) * max(_19648.x, max(_19648.y, _19648.z)))).xyz, vec3(_Globals_.g_flIridescentStrength * _24590)));
    }
    else
    {
        _22671 = _17328;
    }
    vec3 _17892 = mix(_17115, _14786, bvec3(all(equal(_17115, vec3(1.0)))));
    vec3 _10560 = _17641.xyz;
    vec3 _11099 = dFdx(_10560);
    vec3 _9175 = dFdy(_10560);
    vec3 _10347 = _11099.xyz;
    vec3 _12420 = _9175.xyz;
    vec2 _11004 = max(_16306.xy, vec2(pow(saturate(max(dot(_10347, _10347), dot(_12420, _12420))), 0.333000004291534423828125)));
    bvec3 _20337 = bvec3(_Globals_.g_bDisableNormalMapping != 0);
    vec3 _14108 = -_17641;
    vec4 _23875 = vec4(mix(_14786, _17641, _20337).xyz, 1.0);
    vec3 _18708 = vec3(dot(PerViewLightingConstantBufferGpu_t._m5._m0[0].xyzw, _23875), dot(PerViewLightingConstantBufferGpu_t._m5._m0[1].xyzw, _23875), dot(PerViewLightingConstantBufferGpu_t._m5._m0[2].xyzw, _23875));
    bvec4 _24465 = notEqual(PerViewConstantBufferCsgo_t._m1, ivec4(0));
    float _21710;
    if (_24465.x)
    {
        vec3 _11394 = _17641.xyz;
        vec2 _11088 = ((floor(_11408.xy * PerViewConstantBufferCsgo_t._m17) * PerViewConstantBufferCsgo_t._m16.xy) + (PerViewConstantBufferCsgo_t._m16.xy * 0.5)).xy;
        vec4 _18418 = textureGather(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m8], g_bindless_Sampler[_Globals_.g_sCookieSampler]), _11088).xyzw - _11408.zzzz;
        float _18579 = _18418.w;
        float _12013 = _18418.z;
        bool _12285 = abs(_12013) < _18579;
        vec2 _23168;
        if (_12285)
        {
            _23168 = vec2(PerViewConstantBufferCsgo_t._m16.x, 0.0);
        }
        else
        {
            _23168 = vec2(0.0);
        }
        float _20965 = _12285 ? _12013 : _18579;
        float _15372 = _18418.x;
        bool _12286 = abs(_15372) < _20965;
        vec2 _23169;
        if (_12286)
        {
            _23169 = vec2(0.0, PerViewConstantBufferCsgo_t._m16.y);
        }
        else
        {
            _23169 = _23168;
        }
        vec4 _10010 = normalize(vec4(PerViewLightingConstantBufferGpu_t._m7.x * fma(dot(_14108, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[0].xy, 0.25))), 0.5, 0.5), PerViewLightingConstantBufferGpu_t._m7.y * fma(dot(_14108, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[1].xy, 0.25))), 0.5, 0.5), PerViewLightingConstantBufferGpu_t._m7.z * fma(dot(_14108, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[2].xy, 0.25))), 0.5, 0.5), PerViewLightingConstantBufferGpu_t._m7.w * fma(dot(_14108, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[3].xy, 0.25))), 0.5, 0.5)));
        vec4 _13232 = max(vec4(dot(PerViewLightingConstantBufferGpu_t._m6._m0[0].xyz, _11394), dot(PerViewLightingConstantBufferGpu_t._m6._m0[1].xyz, _11394), dot(PerViewLightingConstantBufferGpu_t._m6._m0[2].xyz, _11394), dot(PerViewLightingConstantBufferGpu_t._m6._m0[3].xyz, _11394)).xyzw, vec4(0.0)) * normalize(saturate(((_10010 - vec4(max(max(_10010.x, _10010.y), max(_10010.z, _10010.w)))) + vec4(0.20000000298023223876953125)) * vec4(5.0)));
        _21710 = (1.0 / (dot(_13232, vec4(1.0)) + PerViewLightingConstantBufferGpu_t._m8.x)) * (PerViewLightingConstantBufferGpu_t._m8.x + dot(_13232, textureLod(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m7], g_bindless_Sampler[_Globals_.g_sPointClamp]), (_11088 + mix(_23169, PerViewConstantBufferCsgo_t._m16.xy, bvec2(abs(_18418.y) < (_12286 ? _15372 : _20965))).xy).xy, 0.0)));
    }
    else
    {
        _21710 = 1.0;
    }
    float _21711;
    if (notEqual(PerViewConstantBufferCsgo_t._m0, ivec4(0)).w)
    {
        _21711 = _21710 * textureLod(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m9], g_bindless_Sampler[_Globals_.g_sUserConfig]), (_11408.xy * PerViewConstantBuffer_t._m4.xy).xy, 0.0).x;
    }
    else
    {
        _21711 = _21710;
    }
    vec4 _9716;
    float _24878;
    SPIRV_CROSS_BRANCH
    if (PerViewLightingConstantBufferGpu_t._m18 != 0)
    {
        int _23989;
        int _10191;
        float _13138;
        vec3 _14975;
        int _13039 = 0;
        for (;;)
        {
            if (!(_13039 < PerViewLightingConstantBufferGpu_t._m18))
            {
                _13138 = 1.0;
                _14975 = vec3(0.0);
                _10191 = -1;
                break;
            }
            vec4 _18322 = vec4(input_1.xyz, 1.0) * PerViewLightingConstantBufferGpu_t._m25._m0[_13039];
            float _12779 = _18322.x;
            if (max(abs(_12779), abs(_18322.y)) < PerViewLightingConstantBufferGpu_t._m20[_13039])
            {
                vec3 _19470 = vec3(_12779, _18322.yz);
                vec2 _24804 = _19470.xy;
                vec2 _22193 = vec2(1.0) - saturate((abs(_24804) * vec2(PerViewLightingConstantBufferGpu_t._m22)) + vec2(PerViewLightingConstantBufferGpu_t._m21));
                vec2 _20561 = (_24804 * PerViewLightingConstantBufferGpu_t._m26._m0[_13039].zw) + PerViewLightingConstantBufferGpu_t._m26._m0[_13039].xy;
                vec3 _20489 = _19470;
                _20489.x = _20561.x;
                _20489.y = _20561.y;
                _13138 = saturate(_22193.x * _22193.y);
                _14975 = _20489;
                _10191 = _13039;
                break;
            }
            _23989 = _13039 + 1;
            _13039 = _23989;
            continue;
        }
        vec4 _9982;
        float _22532;
        if (_10191 >= 0)
        {
            vec2 _7045;
            vec2 _7046;
            vec2 _7735;
            float _8969;
            float _8970;
            float _15996;
            float _17299;
            vec2 _18870;
            vec4 _20581;
            vec4 _24370;
            uint _24711;
            float _22304;
            do
            {
                float _21452 = saturate(_14975.z + PerViewLightingConstantBufferGpu_t._m19);
                _20581 = PerViewLightingConstantBufferGpu_t._m0;
                _24370 = PerViewLightingConstantBufferGpu_t._m1;
                _24711 = _Globals_.g_tShadowDepthBufferCmpSampler;
                _17299 = PerViewLightingConstantBufferGpu_t._m2.z;
                _15996 = PerViewLightingConstantBufferGpu_t._m3.z;
                _18870 = vec2(_17299, _15996);
                _8969 = PerViewLightingConstantBufferGpu_t._m2.y;
                _7045 = vec2(_8969, _15996);
                _8970 = PerViewLightingConstantBufferGpu_t._m3.y;
                _7046 = vec2(_17299, _8970);
                _7735 = vec2(_8969, _8970);
                float _15310 = dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _18870).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _7045).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _7046).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _7735).xy, _21452), 0.0)).xyzw, vec4(0.25));
                bool _12888;
                if (_15310 == 0.0)
                {
                    _12888 = true;
                }
                else
                {
                    _12888 = _15310 == 1.0;
                }
                if (_12888)
                {
                    _22304 = _15310;
                    break;
                }
                _22304 = ((_15310 * (_20581.w * 4.0)) + dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(_17299, 0.0)).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(_8969, 0.0)).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(0.0, _8970)).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(0.0, _15996)).xy, _21452), 0.0)).xyzw, _24370.xxxx)) + (textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3(_14975.xy, _21452), 0.0) * _24370.y);
                break;
            } while(false);
            vec4 _15390 = _2104[_10191] * _13138;
            vec4 _13212;
            float _15670;
            SPIRV_CROSS_BRANCH
            if (_13138 < 1.0)
            {
                vec4 _8755;
                float _11103;
                if (_10191 < (PerViewLightingConstantBufferGpu_t._m18 - 1))
                {
                    int _15335 = _10191 + 1;
                    vec4 _19671 = vec4(input_1.xyz, 1.0) * PerViewLightingConstantBufferGpu_t._m25._m0[_15335];
                    vec2 _20562 = (_19671.xy * PerViewLightingConstantBufferGpu_t._m26._m0[_15335].zw) + PerViewLightingConstantBufferGpu_t._m26._m0[_15335].xy;
                    vec3 _20490;
                    _20490.x = _20562.x;
                    _20490.y = _20562.y;
                    float _22305;
                    do
                    {
                        float _20322 = saturate(_19671.z + PerViewLightingConstantBufferGpu_t._m19);
                        float _15311 = dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + _18870).xy, _20322), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + _7045).xy, _20322), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + _7046).xy, _20322), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + _7735).xy, _20322), 0.0)).xyzw, vec4(0.25));
                        bool _12889;
                        if (_15311 == 0.0)
                        {
                            _12889 = true;
                        }
                        else
                        {
                            _12889 = _15311 == 1.0;
                        }
                        if (_12889)
                        {
                            _22305 = _15311;
                            break;
                        }
                        _22305 = ((_15311 * (_20581.w * 4.0)) + dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + vec2(_17299, 0.0)).xy, _20322), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + vec2(_8969, 0.0)).xy, _20322), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + vec2(0.0, _8970)).xy, _20322), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20490.xy + vec2(0.0, _15996)).xy, _20322), 0.0)).xyzw, _24370.xxxx)) + (textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3(_20490.xy, _20322), 0.0) * _24370.y);
                        break;
                    } while(false);
                    _8755 = _15390 + (_2104[_15335] * (1.0 - _13138));
                    _11103 = _22305;
                }
                else
                {
                    _8755 = _15390;
                    _11103 = 1.0;
                }
                _13212 = _8755;
                _15670 = mix(_11103, _22304, _13138);
            }
            else
            {
                _13212 = _15390;
                _15670 = _22304;
            }
            _9982 = _13212;
            _22532 = _15670;
        }
        else
        {
            _9982 = vec4(0.0);
            _22532 = 1.0;
        }
        float _13279 = mix(_22532, 1.0, saturate((distance(_20327.xyz, PerViewConstantBuffer_t._m7) * PerViewLightingConstantBufferGpu_t._m24) + PerViewLightingConstantBufferGpu_t._m23));
        float _12505;
        if (_24465.y)
        {
            _12505 = min(_13279, textureLod(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m10], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), (_11408.xy * PerViewConstantBuffer_t._m4.xy).xy, 0.0).z);
        }
        else
        {
            _12505 = _13279;
        }
        _9716 = _9982;
        _24878 = _12505;
    }
    else
    {
        _9716 = vec4(0.0);
        _24878 = 1.0;
    }
    vec3 _12688 = _14786.xyz;
    vec3 _6617;
    vec3 _12890;
    float _13139;
    SPIRV_CROSS_BRANCH
    if ((dot(PerViewLightingConstantBufferGpu_t._m16.xyz, _12688) * _24878) > 0.0)
    {
        vec3 _15042 = mix(_12688, _17641, _20337);
        vec3 _15460 = mix(_17892, _15042, bvec3(all(equal(_17892, vec3(1.0)))));
        float _13811 = max(0.0, dot(_15042.xyz, PerViewLightingConstantBufferGpu_t._m16.xyz));
        vec3 _17874 = vec3(_13811);
        vec3 _18223;
        if (_13694 > 0.0)
        {
            float _8780 = dot(_15460, PerViewLightingConstantBufferGpu_t._m16.xyz);
            float _8124 = saturate(_13694);
            _18223 = mix(_17874.xyz, vec3((((0.5 + (_13811 * 0.5)) + pow(1.0 - saturate(_8780), 4.0)) * saturate((_8780 + 0.20000000298023223876953125) * 4.0)) * saturate(mix(dot(mix(_15042, _15460, vec3(10.0)), PerViewLightingConstantBufferGpu_t._m16.xyz), 1.0, _8124))), vec3(_8124));
        }
        else
        {
            _18223 = _17874;
        }
        vec2 _17301 = max(_11004, vec2(PerViewLightingConstantBufferGpu_t._m16.w));
        vec3 _21889 = (-normalize(_20327.xyz - PerViewConstantBuffer_t._m7.xyz)).xyz;
        vec3 _12281 = normalize(PerViewLightingConstantBufferGpu_t._m16.xyz + _21889).xyz;
        vec3 _19012 = _15460.xyz;
        float _12386 = dot(_12281, _19012);
        float _9850 = _17301.x;
        float _25211 = _9850 * _9850;
        float _24198 = _25211 / (((_12386 * _12386) * ((_25211 * _25211) - 1.0)) + 1.0);
        float _16150 = _9850 + 1.0;
        float _6835 = (_16150 * _16150) * 0.125;
        float _19569 = 1.0 - _6835;
        vec3 _16808 = (PerViewLightingConstantBufferGpu_t._m17.xyz * _24878).xyz;
        _13139 = 1.0;
        _12890 = PerViewLightingConstantBufferGpu_t._m9.xyz + (_18223.xyz * _16808);
        _6617 = (((_22671.xyz + ((vec3(1.0) - _22671.xyz) * pow(max(9.9999999747524270787835121154785e-07, 1.0 - max(0.0, dot(PerViewLightingConstantBufferGpu_t._m16.xyz, _12281))), 5.0))) * ((_24198 * _24198) / ((4.0 * ((_13811 * _19569) + _6835)) * ((max(0.0, dot(_19012, _21889)) * _19569) + _6835)))).xyz * _13811).xyz * _16808;
    }
    else
    {
        _13139 = 0.0;
        _12890 = PerViewLightingConstantBufferGpu_t._m9.xyz;
        _6617 = vec3(0.0);
    }
    bvec4 _24467 = notEqual(PerViewConstantBufferCsgo_t._m2, ivec4(0));
    bool _20061 = _24467.x;
    vec4 _19363;
    if (_20061)
    {
        vec4 _18621 = vec4(_20327.xyz, 1.0).xyzw * PerViewConstantBufferCsgo_t._m15;
        float _20176 = _18621.w;
        vec2 _11414 = _18621.xy / vec2(_20176);
        vec4 _6651;
        _6651.x = clamp(((_11414.x + 1.0) * PerViewConstantBuffer_t._m3.x) * 0.5, 0.0, PerViewConstantBuffer_t._m3.x - 1.0);
        _6651.y = clamp(((1.0 - _11414.y) * PerViewConstantBuffer_t._m3.y) * 0.5, 0.0, PerViewConstantBuffer_t._m3.y - 1.0);
        _6651.w = _20176;
        _19363 = _6651;
    }
    else
    {
        _19363 = _11408;
    }
    uvec2 _7663 = uvec2(PerViewLightingConstantBufferGpu_t._m12.x);
    uvec2 _12083 = uvec2(_19363.xy - PerViewConstantBuffer_t._m2.xy) >> _7663;
    uint _10838 = PerViewLightingConstantBufferGpu_t._m10.y + (((_12083.y * PerViewLightingConstantBufferGpu_t._m12.y) + _12083.x) * PerViewLightingConstantBufferGpu_t._m10.z);
    uint _23393 = PerViewLightingConstantBufferGpu_t._m10.x + (uint(clamp(_19363.w * PerViewLightingConstantBufferGpu_t._m13.x, 0.0, PerViewLightingConstantBufferGpu_t._m13.y)) * PerViewLightingConstantBufferGpu_t._m10.z);
    float _13140;
    vec3 _16308;
    vec3 _17116;
    float _17117;
    vec3 _17133;
    _13140 = _13139;
    _16308 = _12890;
    _17116 = _18708;
    _17117 = dot(_18708.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
    _17133 = _6617;
    uint _21567;
    float _13141;
    vec3 _16309;
    vec3 _17118;
    vec3 _17119;
    float _17134;
    mat3 _20506;
    mat3 _23854;
    uint _17017 = 0u;
    for (;;)
    {
        if (!(_17017 < PerViewLightingConstantBufferGpu_t._m10.z))
        {
            break;
        }
        uint _14475 = subgroupOr(g_CullBits_1._m0[_10838 + _17017] & g_CullBits_1._m0[_23393 + _17017]);
        _13141 = _17117;
        _16309 = _17116;
        _17118 = _17133;
        _17119 = _16308;
        _17134 = _13140;
        uint _20344;
        float _13159;
        vec3 _16318;
        float _16488;
        vec3 _17125;
        vec3 _17193;
        uint _17018 = _14475;
        for (;;)
        {
            if (!(_17018 != 0u))
            {
                break;
            }
            int _12608 = int(uint(findLSB(_17018)) + (_17017 * 32u));
            _20344 = _17018 & (_17018 - 1u);
            do
            {
                vec3 _13372 = -normalize(_20327.xyz - PerViewConstantBuffer_t._m7.xyz);
                vec4 _24893 = g_BarnLights_1._m0[_12608]._m0 * vec4(input_1.xyz, 1.0);
                vec3 _10521 = _24893.xyz / vec3(_24893.w);
                vec4 _22905;
                _22905.x = _10521.x;
                _22905.y = _10521.y;
                float _21775 = _10521.z;
                _22905.z = _21775;
                vec3 _21642 = _22905.xyz;
                bool _7426;
                if (all(greaterThan(_22905.xyz, vec3(-1.0, -1.0, 0.0))))
                {
                    _7426 = all(lessThan(_22905.xyz, vec3(1.0)));
                }
                else
                {
                    _7426 = false;
                }
                bool _12891;
                if (!_7426)
                {
                    _12891 = true;
                }
                else
                {
                    _12891 = !all(lessThanEqual(abs((g_BarnLights_1._m0[_12608]._m15 * vec4(input_1.xyz, 1.0)).xyz), vec3(1.0)));
                }
                if (_12891)
                {
                    _13159 = _13141;
                    _16318 = _16309;
                    _17125 = _17118;
                    _17193 = _17119;
                    _16488 = _17134;
                    break;
                }
                bool _10021 = (g_BarnLights_1._m0[_12608]._m13 & 1u) != 0u;
                bool _6227;
                bool _13144;
                bool _13960;
                bool _16311;
                bool _17120;
                bool _17121;
                SPIRV_CROSS_BRANCH
                if (g_BarnLights_1._m0[_12608]._m7 != 0u)
                {
                    bool _23545 = g_BarnLights_1._m0[_12608]._m7 == 1u;
                    bool _13143;
                    bool _16310;
                    bool _16480;
                    bool _17190;
                    if (_23545)
                    {
                        _13143 = false;
                        _16310 = false;
                        _17190 = false;
                        _16480 = false;
                    }
                    else
                    {
                        bool _21123 = g_BarnLights_1._m0[_12608]._m7 == 2u;
                        bool _13142;
                        bool _16381;
                        bool _16479;
                        if (_21123)
                        {
                            _13142 = false;
                            _16381 = false;
                            _16479 = false;
                        }
                        else
                        {
                            bool _21124 = g_BarnLights_1._m0[_12608]._m7 == 3u;
                            bool _13214;
                            bool _15672;
                            if (_21124)
                            {
                                _13214 = false;
                                _15672 = false;
                            }
                            else
                            {
                                bool _13213;
                                bool _15671;
                                if (g_BarnLights_1._m0[_12608]._m7 == 4u)
                                {
                                    _13213 = false;
                                    _15671 = true;
                                }
                                else
                                {
                                    bool _20739 = g_BarnLights_1._m0[_12608]._m7 == 5u;
                                    _13213 = _20739;
                                    _15671 = _20739;
                                }
                                _13214 = _13213;
                                _15672 = _15671;
                            }
                            _13142 = _13214;
                            _16381 = _15672;
                            _16479 = _21124;
                        }
                        _13143 = _16381;
                        _16310 = _16479;
                        _17190 = _21123;
                        _16480 = _13142;
                    }
                    _13144 = _16480;
                    _16311 = false;
                    _17120 = _13143;
                    _17121 = _16310;
                    _13960 = _17190;
                    _6227 = _23545;
                }
                else
                {
                    _13144 = false;
                    _16311 = true;
                    _17120 = false;
                    _17121 = false;
                    _13960 = false;
                    _6227 = false;
                }
                bool _12559 = !_6227;
                bool _12892;
                if (_12559)
                {
                    _12892 = !_13960;
                }
                else
                {
                    _12892 = false;
                }
                bool _12893;
                if (_12892)
                {
                    _12893 = !_17121;
                }
                else
                {
                    _12893 = false;
                }
                bool _25013;
                if (_12893)
                {
                    _25013 = !_17120;
                }
                else
                {
                    _25013 = false;
                }
                float _23571 = 2.0 * g_BarnLights_1._m0[_12608]._m5.y;
                float _18492 = (2.0 * g_BarnLights_1._m0[_12608]._m5.z) * g_BarnLights_1._m0[_12608]._m5.z;
                float _14805 = 2.0 * g_BarnLights_1._m0[_12608]._m5.x;
                float _9058 = _14805 * g_BarnLights_1._m0[_12608]._m5.y;
                float _17330 = 2.0 * g_BarnLights_1._m0[_12608]._m5.w;
                float _19825 = _17330 * g_BarnLights_1._m0[_12608]._m5.z;
                vec3 _16268 = vec3(_9058 - _19825, (1.0 - (_14805 * g_BarnLights_1._m0[_12608]._m5.x)) - _18492, (_23571 * g_BarnLights_1._m0[_12608]._m5.z) + (_17330 * g_BarnLights_1._m0[_12608]._m5.x)) * g_BarnLights_1._m0[_12608]._m6.z;
                float _21316;
                if (g_BarnLights_1._m0[_12608]._m3.z > 0.0)
                {
                    _21316 = smoothstep(0.0, 1.0, _21775 * g_BarnLights_1._m0[_12608]._m3.z);
                }
                else
                {
                    _21316 = 1.0;
                }
                float _19667;
                if (g_BarnLights_1._m0[_12608]._m3.w > 0.0)
                {
                    _19667 = _21316 * smoothstep(0.0, 1.0, (1.0 - _21775) * g_BarnLights_1._m0[_12608]._m3.w);
                }
                else
                {
                    _19667 = _21316;
                }
                bool _17624 = g_BarnLights_1._m0[_12608]._m2.w != 0.0;
                vec3 _11179;
                float _13590;
                if (_17624)
                {
                    vec3 _14442 = g_BarnLights_1._m0[_12608]._m2.xyz - input_1.xyz;
                    float _15351 = dot(_14442, _14442);
                    float _10901;
                    if (_25013)
                    {
                        _10901 = _19667 * (g_BarnLights_1._m0[_12608]._m2.w / max(_15351, g_BarnLights_1._m0[_12608]._m2.w));
                    }
                    else
                    {
                        _10901 = _19667;
                    }
                    float _19274 = sqrt(_15351);
                    float _11353 = _10901 * smoothstep(0.0, 1.0, g_BarnLights_1._m0[_12608]._m3.x + (g_BarnLights_1._m0[_12608]._m3.y * _19274));
                    float _20539;
                    if ((!_13960) ? _12559 : false)
                    {
                        vec3 _17729 = _14442 - _16268;
                        vec3 _10210;
                        do
                        {
                            vec3 _20229 = (_14442 + _16268) - _17729;
                            float _25105 = dot(-_17729, _20229);
                            if (_25105 <= 0.0)
                            {
                                _10210 = _17729;
                                break;
                            }
                            else
                            {
                                _10210 = _17729 + (_20229 * min(1.0, _25105 / dot(_20229, _20229)));
                                break;
                            }
                            break; // unreachable workaround
                        } while(false);
                        _20539 = _11353 * saturate(g_BarnLights_1._m0[_12608]._m6.x + (g_BarnLights_1._m0[_12608]._m6.y * dot(vec3((1.0 - (_23571 * g_BarnLights_1._m0[_12608]._m5.y)) - _18492, _9058 + _19825, (_14805 * g_BarnLights_1._m0[_12608]._m5.z) - (_17330 * g_BarnLights_1._m0[_12608]._m5.y)), normalize(_10210))));
                    }
                    else
                    {
                        _20539 = _11353;
                    }
                    _11179 = _14442 / vec3(_19274);
                    _13590 = _20539;
                }
                else
                {
                    _11179 = g_BarnLights_1._m0[_12608]._m2.xyz;
                    _13590 = _19667;
                }
                vec3 _22614 = (g_BarnLights_1._m0[_12608]._m4.xyz * 1.0).xyz * _13590;
                bool _20900 = !_10021;
                float _21712;
                if (_20900)
                {
                    _21712 = _17134 + 1.0;
                }
                else
                {
                    _21712 = _17134;
                }
                bool _24419;
                if (g_BarnLights_1._m0[_12608]._m8.z > 0.0)
                {
                    _24419 = !_20061;
                }
                else
                {
                    _24419 = false;
                }
                vec3 _21548;
                SPIRV_CROSS_BRANCH
                if (g_BarnLights_1._m0[_12608]._m4.w == 0.0)
                {
                    float _10342;
                    do
                    {
                        vec2 _22154 = abs(_22905.xy);
                        if (g_BarnLights_1._m0[_12608]._m9.z == 0.0)
                        {
                            _10342 = smoothstep(1.0, g_BarnLights_1._m0[_12608]._m9.x, _22154.x) * smoothstep(1.0, g_BarnLights_1._m0[_12608]._m9.y, _22154.y);
                            break;
                        }
                        else
                        {
                            float _11473 = _22154.x;
                            float _15267 = 2.0 / g_BarnLights_1._m0[_12608]._m9.z;
                            float _15020 = _22154.y;
                            float _23041 = (-0.5) * g_BarnLights_1._m0[_12608]._m9.z;
                            float _11981 = (g_BarnLights_1._m0[_12608]._m9.x * g_BarnLights_1._m0[_12608]._m9.y) * pow(max(pow(g_BarnLights_1._m0[_12608]._m9.y * _11473, _15267) + pow(g_BarnLights_1._m0[_12608]._m9.x * _15020, _15267), 1.1754943508222875079687365372222e-38), _23041);
                            float _16524 = pow(max(pow(_11473, _15267) + pow(_15020, _15267), 1.1754943508222875079687365372222e-38), _23041);
                            if (_11981 < _16524)
                            {
                                _10342 = smoothstep(_16524, _11981, 1.0);
                                break;
                            }
                            else
                            {
                                _10342 = float(_16524 > 1.0);
                                break;
                            }
                            break; // unreachable workaround
                        }
                        break; // unreachable workaround
                    } while(false);
                    _21548 = _22614.xyz * _10342;
                }
                else
                {
                    vec3 _12506;
                    if (g_BarnLights_1._m0[_12608]._m4.w < 0.0)
                    {
                        vec4 _17795 = vec4(-g_BarnLights_1._m0[_12608]._m5.xyz, g_BarnLights_1._m0[_12608]._m5.w);
                        vec4 _19008 = _17795.xyzw * vec4(-1.0, -1.0, -1.0, 1.0);
                        vec3 _24989 = _19008.xyz;
                        vec3 _23629 = vec4((-_11179).xyz, 0.0).xyz;
                        float _15156 = -dot(_23629, _24989);
                        vec3 _20484 = vec4((_23629 * _19008.w) + cross(_23629, _24989), _15156).xyz;
                        vec3 _23592 = _17795.xyz;
                        vec3 _12170 = ((_20484 * g_BarnLights_1._m0[_12608]._m5.w) + (_23592 * _15156)) + cross(_23592, _20484);
                        vec3 _14081 = vec3(vec2(atan(_12170.y, -_12170.x) * 0.15915493667125701904296875, acos(_12170.z) * 0.3183098733425140380859375), -g_BarnLights_1._m0[_12608]._m4.w);
                        vec2 _20564 = (_14081.xy * g_BarnLights_1._m0[_12608]._m9.zw) + g_BarnLights_1._m0[_12608]._m9.xy;
                        vec3 _20492 = _14081;
                        _20492.x = _20564.x;
                        _20492.y = _20564.y;
                        _12506 = _22614.xyz * textureLod(sampler3D(g_bindless_Texture3D_float4[PerViewLightingConstantBufferGpu_t._m28], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _20492.xyz, 0.0).xyz;
                    }
                    else
                    {
                        vec3 _13791 = vec3(fma(_22905.xy, vec2(0.5, -0.5), vec2(0.5)), g_BarnLights_1._m0[_12608]._m4.w);
                        vec2 _20563 = (_13791.xy * g_BarnLights_1._m0[_12608]._m9.zw) + g_BarnLights_1._m0[_12608]._m9.xy;
                        vec3 _20491 = _13791;
                        _20491.x = _20563.x;
                        _20491.y = _20563.y;
                        _12506 = _22614.xyz * textureLod(sampler3D(g_bindless_Texture3D_float4[PerViewLightingConstantBufferGpu_t._m28], g_bindless_Sampler[_Globals_.g_sCookieSampler]), _20491.xyz, 0.0).xyz;
                    }
                    _21548 = _12506;
                }
                if (all(equal(_21548.xyz, vec3(0.0))))
                {
                    _13159 = _13141;
                    _16318 = _16309;
                    _17125 = _17118;
                    _17193 = _17119;
                    _16488 = _21712;
                    break;
                }
                vec3 _7427;
                if (_24419)
                {
                    vec3 _19629;
                    if ((g_BarnLights_1._m0[_12608]._m13 & 4u) != 0u)
                    {
                        vec2 _6281 = _22905.yx * vec2(1.0, -1.0);
                        vec3 _23714 = _21642;
                        _23714.x = _6281.x;
                        _23714.y = _6281.y;
                        _19629 = _23714;
                    }
                    else
                    {
                        _19629 = _21642;
                    }
                    float _24972;
                    do
                    {
                        float _21462 = saturate(_19629.z + PerViewLightingConstantBufferGpu_t._m19);
                        vec2 _10393 = vec3(fma(_19629.xy, g_BarnLights_1._m0[_12608]._m8.zw, g_BarnLights_1._m0[_12608]._m8.xy), _19629.z).xy;
                        float _15312 = dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.z, PerViewLightingConstantBufferGpu_t._m3.z)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.y, PerViewLightingConstantBufferGpu_t._m3.z)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.z, PerViewLightingConstantBufferGpu_t._m3.y)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.y, PerViewLightingConstantBufferGpu_t._m3.y)).xy, _21462), 0.0)).xyzw, vec4(0.25));
                        bool _12894;
                        if (_15312 == 0.0)
                        {
                            _12894 = true;
                        }
                        else
                        {
                            _12894 = _15312 == 1.0;
                        }
                        if (_12894)
                        {
                            _24972 = _15312;
                            break;
                        }
                        _24972 = ((_15312 * (PerViewLightingConstantBufferGpu_t._m0.w * 4.0)) + dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.z, 0.0)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.y, 0.0)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(0.0, PerViewLightingConstantBufferGpu_t._m3.y)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(0.0, PerViewLightingConstantBufferGpu_t._m3.z)).xy, _21462), 0.0)).xyzw, PerViewLightingConstantBufferGpu_t._m1.xxxx)) + (textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3(_10393, _21462), 0.0) * PerViewLightingConstantBufferGpu_t._m1.y);
                        break;
                    } while(false);
                    vec3 _19878 = _21548.xyz * mix(1.0, _24972, g_BarnLights_1._m0[_12608]._m12);
                    if (all(equal(_19878.xyz, vec3(0.0))))
                    {
                        _13159 = _13141;
                        _16318 = _16309;
                        _17125 = _17118;
                        _17193 = _17119;
                        _16488 = _21712;
                        break;
                    }
                    _7427 = _19878;
                }
                else
                {
                    _7427 = _21548;
                }
                SPIRV_CROSS_BRANCH
                if (!_16311)
                {
                    vec3 _13145;
                    vec3 _14005;
                    vec3 _16312;
                    vec3 _17124;
                    vec3 _23299;
                    if (_17624)
                    {
                        _13145 = g_BarnLights_1._m0[_12608]._m20.xyz - input_1.xyz;
                        _16312 = g_BarnLights_1._m0[_12608]._m19.xyz - input_1.xyz;
                        _17124 = g_BarnLights_1._m0[_12608]._m17.xyz - input_1.xyz;
                        _14005 = g_BarnLights_1._m0[_12608]._m18.xyz - input_1.xyz;
                        _23299 = g_BarnLights_1._m0[_12608]._m2.xyz - input_1.xyz;
                    }
                    else
                    {
                        _13145 = g_BarnLights_1._m0[_12608]._m20.xyz;
                        _16312 = g_BarnLights_1._m0[_12608]._m19.xyz;
                        _17124 = g_BarnLights_1._m0[_12608]._m17.xyz;
                        _14005 = g_BarnLights_1._m0[_12608]._m18.xyz;
                        _23299 = g_BarnLights_1._m0[_12608]._m2.xyz;
                    }
                    float _20710 = saturate(1.0 + ((dot(g_BarnLights_1._m0[_12608]._m16.xyz, _14786) - dot(input_1.xyz, _14786)) * g_BarnLights_1._m0[_12608]._m20.w));
                    float _18826 = dot(_12688, _13372);
                    vec2 _11160 = ((vec2(max(dot(_11004.xy, vec2(0.5)), g_BarnLights_1._m0[_12608]._m11), sqrt(1.0 - max(0.0, _18826))) * 0.984375) + vec2(0.0078125)).xy;
                    vec4 _14620 = textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sBilinearClamp]), vec3(_11160, 0.0).xyz, 0.0);
                    vec4 _19659 = textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sBilinearClamp]), vec3(_11160, 1.0).xyz, 0.0);
                    vec3 _14469 = (_7427 * (g_BarnLights_1._m0[_12608]._m17.w * ((_20710 * _20710) * (((-2.0) * _20710) + 3.0)))).xyz;
                    vec3 _11229;
                    vec3 _13146;
                    vec3 _15675;
                    vec3 _16313;
                    if (_17121)
                    {
                        float _6218 = min(0.99989998340606689453125, g_BarnLights_1._m0[_12608]._m18.w / length(_23299));
                        vec3 _21958 = normalize(_23299);
                        float _10835 = _6218 / sqrt(1.0 - (_6218 * _6218));
                        float _12052 = _21958.z;
                        float _8220 = (_12052 >= 0.0) ? 1.0 : (-1.0);
                        float _16417 = (-1.0) / (_8220 + _12052);
                        float _14759 = _21958.x;
                        float _23071 = _21958.y;
                        float _19133 = (_14759 * _23071) * _16417;
                        vec3 _15881 = vec3(1.0 + (((_8220 * _14759) * _14759) * _16417), _8220 * _19133, (-_8220) * _14759) * _10835;
                        vec3 _14734 = _21958 - _15881;
                        vec3 _10603 = vec3(_19133, _8220 + ((_23071 * _23071) * _16417), -_23071) * _10835;
                        vec3 _21757 = _21958 + _15881;
                        _13146 = _14734 + _10603;
                        _16313 = _21757 + _10603;
                        _15675 = _14734 - _10603;
                        _11229 = _21757 - _10603;
                    }
                    else
                    {
                        _13146 = _13145;
                        _16313 = _16312;
                        _15675 = _17124;
                        _11229 = _14005;
                    }
                    float _13174;
                    float _16055;
                    SPIRV_CROSS_BRANCH
                    if (_6227)
                    {
                        vec3 _24925 = normalize(_13372 - (_12688 * _18826));
                        mat3 _18557 = mat3(_24925, cross(_12688, _24925), _12688);
                        mat3 _13456 = _18557 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                        bool _7590 = dot(_15675.xyz, cross(_11229 - _15675, _13146 - _15675)) < 0.0;
                        vec3 _18717 = normalize(_15675 * _13456);
                        vec3 _21741 = normalize(_11229 * _13456);
                        vec3 _18267 = normalize(_16313 * _13456);
                        vec3 _12862 = normalize(_13146 * _13456);
                        float _7256 = dot(_18717, _21741);
                        float _24801 = abs(_7256);
                        float _17271 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _24801)) * _24801)) / (3.41759395599365234375 + ((4.1616725921630859375 + _24801) * _24801));
                        float _19753;
                        if (_7256 > 0.0)
                        {
                            _19753 = _17271;
                        }
                        else
                        {
                            _19753 = (0.5 * inversesqrt(max(1.0 - (_7256 * _7256), 1.0000000116860974230803549289703e-07))) - _17271;
                        }
                        float _21658 = dot(_21741, _18267);
                        float _16588 = abs(_21658);
                        float _17272 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _16588)) * _16588)) / (3.41759395599365234375 + ((4.1616725921630859375 + _16588) * _16588));
                        float _19754;
                        if (_21658 > 0.0)
                        {
                            _19754 = _17272;
                        }
                        else
                        {
                            _19754 = (0.5 * inversesqrt(max(1.0 - (_21658 * _21658), 1.0000000116860974230803549289703e-07))) - _17272;
                        }
                        float _14122 = dot(_18267, _12862);
                        float _9332 = abs(_14122);
                        float _17273 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _9332)) * _9332)) / (3.41759395599365234375 + ((4.1616725921630859375 + _9332) * _9332));
                        float _19755;
                        if (_14122 > 0.0)
                        {
                            _19755 = _17273;
                        }
                        else
                        {
                            _19755 = (0.5 * inversesqrt(max(1.0 - (_14122 * _14122), 1.0000000116860974230803549289703e-07))) - _17273;
                        }
                        float _14123 = dot(_12862, _18717);
                        float _9333 = abs(_14123);
                        float _17274 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _9333)) * _9333)) / (3.41759395599365234375 + ((4.1616725921630859375 + _9333) * _9333));
                        float _19756;
                        if (_14123 > 0.0)
                        {
                            _19756 = _17274;
                        }
                        else
                        {
                            _19756 = (0.5 * inversesqrt(max(1.0 - (_14123 * _14123), 1.0000000116860974230803549289703e-07))) - _17274;
                        }
                        vec3 _21197 = (((cross(_18717, _21741) * _19753) + (cross(_21741, _18267) * _19754)) + (cross(_18267, _12862) * _19755)) + (cross(_12862, _18717) * _19756);
                        float _13821 = length(_21197);
                        float _21385 = _21197.z / _13821;
                        float _11237;
                        if (_7590)
                        {
                            _11237 = -_21385;
                        }
                        else
                        {
                            _11237 = _21385;
                        }
                        float _12515;
                        SPIRV_CROSS_BRANCH
                        if (_20900)
                        {
                            mat3 _9064 = _18557 * mat3(vec3(_14620.x, 0.0, _14620.z), vec3(0.0, 1.0, 0.0), vec3(_14620.y, 0.0, _14620.w));
                            vec3 _13737 = normalize(_15675 * _9064);
                            vec3 _21766 = normalize(_11229 * _9064);
                            vec3 _18268 = normalize(_16313 * _9064);
                            vec3 _12866 = normalize(_13146 * _9064);
                            float _7259 = dot(_13737, _21766);
                            float _24802 = abs(_7259);
                            float _17275 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _24802)) * _24802)) / (3.41759395599365234375 + ((4.1616725921630859375 + _24802) * _24802));
                            float _19757;
                            if (_7259 > 0.0)
                            {
                                _19757 = _17275;
                            }
                            else
                            {
                                _19757 = (0.5 * inversesqrt(max(1.0 - (_7259 * _7259), 1.0000000116860974230803549289703e-07))) - _17275;
                            }
                            float _21659 = dot(_21766, _18268);
                            float _16589 = abs(_21659);
                            float _17276 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _16589)) * _16589)) / (3.41759395599365234375 + ((4.1616725921630859375 + _16589) * _16589));
                            float _19758;
                            if (_21659 > 0.0)
                            {
                                _19758 = _17276;
                            }
                            else
                            {
                                _19758 = (0.5 * inversesqrt(max(1.0 - (_21659 * _21659), 1.0000000116860974230803549289703e-07))) - _17276;
                            }
                            float _14135 = dot(_18268, _12866);
                            float _9334 = abs(_14135);
                            float _17277 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _9334)) * _9334)) / (3.41759395599365234375 + ((4.1616725921630859375 + _9334) * _9334));
                            float _19759;
                            if (_14135 > 0.0)
                            {
                                _19759 = _17277;
                            }
                            else
                            {
                                _19759 = (0.5 * inversesqrt(max(1.0 - (_14135 * _14135), 1.0000000116860974230803549289703e-07))) - _17277;
                            }
                            float _14136 = dot(_12866, _13737);
                            float _9335 = abs(_14136);
                            float _17279 = (0.8543984889984130859375 + ((0.4965155124664306640625 + (0.01452060043811798095703125 * _9335)) * _9335)) / (3.41759395599365234375 + ((4.1616725921630859375 + _9335) * _9335));
                            float _19760;
                            if (_14136 > 0.0)
                            {
                                _19760 = _17279;
                            }
                            else
                            {
                                _19760 = (0.5 * inversesqrt(max(1.0 - (_14136 * _14136), 1.0000000116860974230803549289703e-07))) - _17279;
                            }
                            vec3 _21198 = (((cross(_13737, _21766) * _19757) + (cross(_21766, _18268) * _19758)) + (cross(_18268, _12866) * _19759)) + (cross(_12866, _13737) * _19760);
                            float _13822 = length(_21198);
                            float _21386 = _21198.z / _13822;
                            float _11238;
                            if (_7590)
                            {
                                _11238 = -_21386;
                            }
                            else
                            {
                                _11238 = _21386;
                            }
                            _12515 = _7590 ? 0.0 : (_13822 * textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), vec3((vec2((_11238 * 0.5) + 0.5, _13822) * 0.984375) + vec2(0.0078125), 1.0).xyz, 0.0).w);
                        }
                        else
                        {
                            _12515 = 0.0;
                        }
                        _13174 = _12515;
                        _16055 = _7590 ? 0.0 : (_13821 * textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), vec3((vec2((_11237 * 0.5) + 0.5, _13821) * 0.984375) + vec2(0.0078125), 1.0).xyz, 0.0).w);
                    }
                    else
                    {
                        float _13216;
                        float _15679;
                        if (_17121 ? true : _13960)
                        {
                            vec3 _8639;
                            vec3 _10850;
                            vec3 _12961;
                            float _12901;
                            do
                            {
                                vec3 _24924 = normalize(_13372 - (_12688 * _18826));
                                mat3 _18904 = mat3(_24924, cross(_12688, _24924), _12688);
                                vec3 _10771 = _15675 * _18904;
                                vec3 _21769 = _11229 * _18904;
                                vec3 _11957 = _16313 * _18904;
                                _12961 = (_10771 + _11957) * 0.5;
                                _10850 = (_21769 - _11957) * 0.5;
                                _8639 = (_21769 - _10771) * 0.5;
                                vec3 _9099 = _12961 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                                vec3 _24418 = _10850 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                                vec3 _17135 = _8639 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                                vec3 _10508 = normalize(_9099);
                                float _10677 = max(0.0, dot(_10508, cross(_24418, _17135))) / dot(_9099, _9099);
                                float _10020;
                                vec3 _23478;
                                if (_10677 < 9.9999999747524270787835121154785e-07)
                                {
                                    if (_10508.z <= 0.0)
                                    {
                                        _12901 = 0.0;
                                        break;
                                    }
                                    _10020 = _10677;
                                    _23478 = _10508;
                                }
                                else
                                {
                                    float _6777 = dot(_24418, _24418);
                                    float _16970 = dot(_17135, _17135);
                                    float _20085 = dot(_24418, _17135);
                                    float _21693 = _6777 * _16970;
                                    vec3 _12755;
                                    float _13151;
                                    float _16314;
                                    vec3 _23845;
                                    if ((abs(_20085) / sqrt(_21693)) > 0.001000000047497451305389404296875)
                                    {
                                        float _15646 = _6777 + _16970;
                                        float _16512 = 2.0 * sqrt(((-_20085) * _20085) + _21693);
                                        float _12014 = 0.5 * sqrt(_15646 - _16512);
                                        float _19126 = 0.5 * sqrt(_15646 + _16512);
                                        float _14938 = _12014 + _19126;
                                        float _11057 = _14938 * _14938;
                                        float _23882 = _12014 - _19126;
                                        float _22281 = _23882 * _23882;
                                        vec3 _11066;
                                        vec3 _14020;
                                        if (_6777 > _16970)
                                        {
                                            vec3 _23042 = _24418 * _20085;
                                            _11066 = _23042 + (_17135 * (_22281 - _6777));
                                            _14020 = _23042 + (_17135 * (_11057 - _6777));
                                        }
                                        else
                                        {
                                            vec3 _20620 = _17135 * _20085;
                                            _11066 = _20620 + (_24418 * (_22281 - _16970));
                                            _14020 = _20620 + (_24418 * (_11057 - _16970));
                                        }
                                        _13151 = 1.0 / _22281;
                                        _16314 = 1.0 / _11057;
                                        _12755 = normalize(_11066);
                                        _23845 = normalize(_14020);
                                    }
                                    else
                                    {
                                        float _9261 = 1.0 / _6777;
                                        float _9785 = 1.0 / _16970;
                                        _13151 = _9785;
                                        _16314 = _9261;
                                        _12755 = _17135 * sqrt(_9785);
                                        _23845 = _24418 * sqrt(_9261);
                                    }
                                    vec3 _19232 = cross(_23845, _12755);
                                    vec3 _9005;
                                    if (dot(_9099, _19232) < 0.0)
                                    {
                                        _9005 = _19232 * (-1.0);
                                    }
                                    else
                                    {
                                        _9005 = _19232;
                                    }
                                    float _12140 = dot(_9005, _9099);
                                    float _12660 = dot(_23845, _9099) / _12140;
                                    float _11978 = dot(_12755, _9099) / _12140;
                                    float _17537 = _12140 * _12140;
                                    float _21521 = _16314 * _17537;
                                    float _22330 = _13151 * _17537;
                                    float _22255 = _21521 * _22330;
                                    float _16891 = 1.0 + (_12660 * _12660);
                                    float _11407 = _11978 * _11978;
                                    vec4 _16348;
                                    _16348.x = _22255;
                                    _16348.y = ((_22255 * (_16891 + _11407)) - _21521) - _22330;
                                    _16348.z = (1.0 - (_21521 * _16891)) - (_22330 * (1.0 + _11407));
                                    vec2 _20313 = _16348.yz * vec2(0.3333333432674407958984375);
                                    float _12759 = _20313.x;
                                    vec4 _24569 = _16348;
                                    _24569.y = _12759;
                                    float _15016 = _20313.y;
                                    float _16271 = -_15016;
                                    float _19615 = (_16271 * _15016) + _12759;
                                    float _21651 = -_12759;
                                    float _7649 = (_21651 * _15016) + _22255;
                                    float _21161 = dot(vec2(_15016, _21651), _24569.xy);
                                    float _18998 = sqrt(max(0.0, dot(vec2(4.0 * _19615, -_7649), vec2(_21161, _7649))));
                                    float _7565 = -((((-2.0) * _15016) * _19615) + _7649);
                                    float _12534 = _18998 / _7565;
                                    float _23497 = abs(_12534);
                                    bool _14684 = _23497 < 1.0;
                                    float _11317;
                                    if (_14684)
                                    {
                                        _11317 = _23497;
                                    }
                                    else
                                    {
                                        _11317 = 1.0 / _23497;
                                    }
                                    float _23076 = _11317 * _11317;
                                    float _12289 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23076)) * _23076)) * _11317;
                                    float _14129;
                                    if (_14684)
                                    {
                                        _14129 = _12289;
                                    }
                                    else
                                    {
                                        _14129 = 1.57079601287841796875 - _12289;
                                    }
                                    float _10177 = uintBitsToFloat((floatBitsToUint(_14129) & 2147483647u) | (floatBitsToUint(_12534) & 2147483648u));
                                    float _11199;
                                    if (_7565 < 0.0)
                                    {
                                        _11199 = _10177 + uintBitsToFloat(1078530011u | (floatBitsToUint(_18998) & 2147483648u));
                                    }
                                    else
                                    {
                                        _11199 = _10177;
                                    }
                                    float _21917 = _11199 * 0.3333333432674407958984375;
                                    float _20565 = 2.0 * sqrt(-_19615);
                                    float _24210 = _20565 * cos(_21917);
                                    float _10655 = _20565 * cos(_21917 + 2.094395160675048828125);
                                    float _24506 = (((_24210 + _10655) > (2.0 * _15016)) ? _24210 : _10655) - _15016;
                                    float _24435 = -_22255;
                                    float _23872 = 2.0 * _12759;
                                    float _11806 = _22255 * _18998;
                                    float _14691 = -((_24435 * _7649) + (_23872 * _21161));
                                    float _14518 = _11806 / _14691;
                                    float _23498 = abs(_14518);
                                    bool _14685 = _23498 < 1.0;
                                    float _11318;
                                    if (_14685)
                                    {
                                        _11318 = _23498;
                                    }
                                    else
                                    {
                                        _11318 = 1.0 / _23498;
                                    }
                                    float _23077 = _11318 * _11318;
                                    float _12290 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23077)) * _23077)) * _11318;
                                    float _14130;
                                    if (_14685)
                                    {
                                        _14130 = _12290;
                                    }
                                    else
                                    {
                                        _14130 = 1.57079601287841796875 - _12290;
                                    }
                                    float _10178 = uintBitsToFloat((floatBitsToUint(_14130) & 2147483647u) | (floatBitsToUint(_14518) & 2147483648u));
                                    float _11200;
                                    if (_14691 < 0.0)
                                    {
                                        _11200 = _10178 + uintBitsToFloat(1078530011u | (floatBitsToUint(_11806) & 2147483648u));
                                    }
                                    else
                                    {
                                        _11200 = _10178;
                                    }
                                    float _21918 = _11200 * 0.3333333432674407958984375;
                                    float _20567 = 2.0 * sqrt(-_21161);
                                    float _24211 = _20567 * cos(_21918);
                                    float _11624 = _20567 * cos(_21918 + 2.094395160675048828125);
                                    float _7594 = (((_24211 + _11624) < _23872) ? _24211 : _11624) + _12759;
                                    float _18577 = ((-_24506) * _7594) + _22255;
                                    float _22752 = _24435 / _7594;
                                    float _22986 = ((_12759 * _18577) - (_15016 * (_24506 * _24435))) / ((_16271 * _18577) + (_12759 * _7594));
                                    bool _12899;
                                    if (_22752 < _22986)
                                    {
                                        _12899 = _22752 < _24506;
                                    }
                                    else
                                    {
                                        _12899 = false;
                                    }
                                    vec3 _19321;
                                    if (_12899)
                                    {
                                        _19321 = vec3(_22986, _22752, _24506);
                                    }
                                    else
                                    {
                                        bool _12900;
                                        if (_24506 < _22752)
                                        {
                                            _12900 = _24506 < _22986;
                                        }
                                        else
                                        {
                                            _12900 = false;
                                        }
                                        vec3 _12509;
                                        if (_12900)
                                        {
                                            _12509 = vec3(_22752, _24506, _22986);
                                        }
                                        else
                                        {
                                            _12509 = vec3(_22752, _22986, _24506);
                                        }
                                        _19321 = _12509;
                                    }
                                    float _22129 = -_19321.y;
                                    float _24015 = sqrt(max(0.0, _22129 / _19321.z));
                                    float _7722 = sqrt(max(0.0, _22129 / _19321.x));
                                    _10020 = (_24015 * _7722) * inversesqrt((1.0 + (_24015 * _24015)) * (1.0 + (_7722 * _7722)));
                                    _23478 = normalize(vec3((_21521 * _12660) / (_21521 - _19321.y), (_22330 * _11978) / (_22330 - _19321.y), 1.0) * transpose(mat3(_23845, _12755, _9005)));
                                }
                                _12901 = _10020 * textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), vec3((vec2((_23478.z * 0.5) + 0.5, _10020) * 0.984375) + vec2(0.0078125), 1.0).xyz, 0.0).w;
                                break;
                            } while(false);
                            float _12512;
                            SPIRV_CROSS_BRANCH
                            if (_20900)
                            {
                                mat3 _20642 = mat3(vec3(_14620.x, 0.0, _14620.z), vec3(0.0, 1.0, 0.0), vec3(_14620.y, 0.0, _14620.w));
                                float _12511;
                                do
                                {
                                    vec3 _25129 = _12961 * _20642;
                                    vec3 _19809 = _10850 * _20642;
                                    vec3 _17136 = _8639 * _20642;
                                    vec3 _10509 = normalize(_25129);
                                    float _10679 = max(0.0, dot(_10509, cross(_19809, _17136))) / dot(_25129, _25129);
                                    float _10022;
                                    vec3 _23479;
                                    if (_10679 < 9.9999999747524270787835121154785e-07)
                                    {
                                        if (_10509.z <= 0.0)
                                        {
                                            _12511 = 0.0;
                                            break;
                                        }
                                        _10022 = _10679;
                                        _23479 = _10509;
                                    }
                                    else
                                    {
                                        float _6778 = dot(_19809, _19809);
                                        float _16971 = dot(_17136, _17136);
                                        float _20086 = dot(_19809, _17136);
                                        float _21694 = _6778 * _16971;
                                        vec3 _12756;
                                        float _13154;
                                        float _16315;
                                        vec3 _23846;
                                        if ((abs(_20086) / sqrt(_21694)) > 0.001000000047497451305389404296875)
                                        {
                                            float _15647 = _6778 + _16971;
                                            float _16513 = 2.0 * sqrt(((-_20086) * _20086) + _21694);
                                            float _12015 = 0.5 * sqrt(_15647 - _16513);
                                            float _19128 = 0.5 * sqrt(_15647 + _16513);
                                            float _14939 = _12015 + _19128;
                                            float _11058 = _14939 * _14939;
                                            float _23883 = _12015 - _19128;
                                            float _22282 = _23883 * _23883;
                                            vec3 _11067;
                                            vec3 _14021;
                                            if (_6778 > _16971)
                                            {
                                                vec3 _23043 = _19809 * _20086;
                                                _11067 = _23043 + (_17136 * (_22282 - _6778));
                                                _14021 = _23043 + (_17136 * (_11058 - _6778));
                                            }
                                            else
                                            {
                                                vec3 _20622 = _17136 * _20086;
                                                _11067 = _20622 + (_19809 * (_22282 - _16971));
                                                _14021 = _20622 + (_19809 * (_11058 - _16971));
                                            }
                                            _13154 = 1.0 / _22282;
                                            _16315 = 1.0 / _11058;
                                            _12756 = normalize(_11067);
                                            _23846 = normalize(_14021);
                                        }
                                        else
                                        {
                                            float _9262 = 1.0 / _6778;
                                            float _9786 = 1.0 / _16971;
                                            _13154 = _9786;
                                            _16315 = _9262;
                                            _12756 = _17136 * sqrt(_9786);
                                            _23846 = _19809 * sqrt(_9262);
                                        }
                                        vec3 _19233 = cross(_23846, _12756);
                                        vec3 _9006;
                                        if (dot(_25129, _19233) < 0.0)
                                        {
                                            _9006 = _19233 * (-1.0);
                                        }
                                        else
                                        {
                                            _9006 = _19233;
                                        }
                                        float _12141 = dot(_9006, _25129);
                                        float _12661 = dot(_23846, _25129) / _12141;
                                        float _11979 = dot(_12756, _25129) / _12141;
                                        float _17538 = _12141 * _12141;
                                        float _21522 = _16315 * _17538;
                                        float _22331 = _13154 * _17538;
                                        float _22256 = _21522 * _22331;
                                        float _16895 = 1.0 + (_12661 * _12661);
                                        float _11412 = _11979 * _11979;
                                        vec4 _16349;
                                        _16349.x = _22256;
                                        _16349.y = ((_22256 * (_16895 + _11412)) - _21522) - _22331;
                                        _16349.z = (1.0 - (_21522 * _16895)) - (_22331 * (1.0 + _11412));
                                        vec2 _20314 = _16349.yz * vec2(0.3333333432674407958984375);
                                        float _12760 = _20314.x;
                                        vec4 _24570 = _16349;
                                        _24570.y = _12760;
                                        float _15021 = _20314.y;
                                        float _16272 = -_15021;
                                        float _19616 = (_16272 * _15021) + _12760;
                                        float _21652 = -_12760;
                                        float _7651 = (_21652 * _15021) + _22256;
                                        float _21162 = dot(vec2(_15021, _21652), _24570.xy);
                                        float _18999 = sqrt(max(0.0, dot(vec2(4.0 * _19616, -_7651), vec2(_21162, _7651))));
                                        float _7566 = -((((-2.0) * _15021) * _19616) + _7651);
                                        float _12535 = _18999 / _7566;
                                        float _23499 = abs(_12535);
                                        bool _14686 = _23499 < 1.0;
                                        float _11319;
                                        if (_14686)
                                        {
                                            _11319 = _23499;
                                        }
                                        else
                                        {
                                            _11319 = 1.0 / _23499;
                                        }
                                        float _23078 = _11319 * _11319;
                                        float _12291 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23078)) * _23078)) * _11319;
                                        float _14133;
                                        if (_14686)
                                        {
                                            _14133 = _12291;
                                        }
                                        else
                                        {
                                            _14133 = 1.57079601287841796875 - _12291;
                                        }
                                        float _10179 = uintBitsToFloat((floatBitsToUint(_14133) & 2147483647u) | (floatBitsToUint(_12535) & 2147483648u));
                                        float _11201;
                                        if (_7566 < 0.0)
                                        {
                                            _11201 = _10179 + uintBitsToFloat(1078530011u | (floatBitsToUint(_18999) & 2147483648u));
                                        }
                                        else
                                        {
                                            _11201 = _10179;
                                        }
                                        float _21919 = _11201 * 0.3333333432674407958984375;
                                        float _20568 = 2.0 * sqrt(-_19616);
                                        float _24212 = _20568 * cos(_21919);
                                        float _10656 = _20568 * cos(_21919 + 2.094395160675048828125);
                                        float _24507 = (((_24212 + _10656) > (2.0 * _15021)) ? _24212 : _10656) - _15021;
                                        float _24436 = -_22256;
                                        float _23873 = 2.0 * _12760;
                                        float _11807 = _22256 * _18999;
                                        float _14692 = -((_24436 * _7651) + (_23873 * _21162));
                                        float _14519 = _11807 / _14692;
                                        float _23500 = abs(_14519);
                                        bool _14687 = _23500 < 1.0;
                                        float _11320;
                                        if (_14687)
                                        {
                                            _11320 = _23500;
                                        }
                                        else
                                        {
                                            _11320 = 1.0 / _23500;
                                        }
                                        float _23079 = _11320 * _11320;
                                        float _12292 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23079)) * _23079)) * _11320;
                                        float _14134;
                                        if (_14687)
                                        {
                                            _14134 = _12292;
                                        }
                                        else
                                        {
                                            _14134 = 1.57079601287841796875 - _12292;
                                        }
                                        float _10180 = uintBitsToFloat((floatBitsToUint(_14134) & 2147483647u) | (floatBitsToUint(_14519) & 2147483648u));
                                        float _11205;
                                        if (_14692 < 0.0)
                                        {
                                            _11205 = _10180 + uintBitsToFloat(1078530011u | (floatBitsToUint(_11807) & 2147483648u));
                                        }
                                        else
                                        {
                                            _11205 = _10180;
                                        }
                                        float _21920 = _11205 * 0.3333333432674407958984375;
                                        float _20569 = 2.0 * sqrt(-_21162);
                                        float _24213 = _20569 * cos(_21920);
                                        float _11625 = _20569 * cos(_21920 + 2.094395160675048828125);
                                        float _7595 = (((_24213 + _11625) < _23873) ? _24213 : _11625) + _12760;
                                        float _18578 = ((-_24507) * _7595) + _22256;
                                        float _22754 = _24436 / _7595;
                                        float _22987 = ((_12760 * _18578) - (_15021 * (_24507 * _24436))) / ((_16272 * _18578) + (_12760 * _7595));
                                        bool _12902;
                                        if (_22754 < _22987)
                                        {
                                            _12902 = _22754 < _24507;
                                        }
                                        else
                                        {
                                            _12902 = false;
                                        }
                                        vec3 _19322;
                                        if (_12902)
                                        {
                                            _19322 = vec3(_22987, _22754, _24507);
                                        }
                                        else
                                        {
                                            bool _12903;
                                            if (_24507 < _22754)
                                            {
                                                _12903 = _24507 < _22987;
                                            }
                                            else
                                            {
                                                _12903 = false;
                                            }
                                            vec3 _12510;
                                            if (_12903)
                                            {
                                                _12510 = vec3(_22754, _24507, _22987);
                                            }
                                            else
                                            {
                                                _12510 = vec3(_22754, _22987, _24507);
                                            }
                                            _19322 = _12510;
                                        }
                                        float _22130 = -_19322.y;
                                        float _24016 = sqrt(max(0.0, _22130 / _19322.z));
                                        float _7723 = sqrt(max(0.0, _22130 / _19322.x));
                                        _10022 = (_24016 * _7723) * inversesqrt((1.0 + (_24016 * _24016)) * (1.0 + (_7723 * _7723)));
                                        _23479 = normalize(vec3((_21522 * _12661) / (_21522 - _19322.y), (_22331 * _11979) / (_22331 - _19322.y), 1.0) * transpose(mat3(_23846, _12756, _9006)));
                                    }
                                    _12511 = _10022 * textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), vec3((vec2((_23479.z * 0.5) + 0.5, _10022) * 0.984375) + vec2(0.0078125), 1.0).xyz, 0.0).w;
                                    break;
                                } while(false);
                                _12512 = _12511;
                            }
                            else
                            {
                                _12512 = 0.0;
                            }
                            _13216 = _12512;
                            _15679 = _12901;
                        }
                        else
                        {
                            float _13215;
                            float _15678;
                            if (_17120)
                            {
                                vec3 _24923 = normalize(_13372 - (_12688 * _18826));
                                mat3 _18903 = mat3(_24923, cross(_12688, _24923), _12688);
                                vec3 _10770 = _15675 * _18903;
                                vec3 _22054 = _11229 * _18903;
                                vec3 _11357 = _10770 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                                vec3 _12685 = _22054 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                                float _17352;
                                do
                                {
                                    vec3 _23093 = normalize(_12685 - _11357);
                                    float _12217 = _11357.z;
                                    bool _12895;
                                    if (_12217 <= 0.0)
                                    {
                                        _12895 = _12685.z <= 0.0;
                                    }
                                    else
                                    {
                                        _12895 = false;
                                    }
                                    if (_12895)
                                    {
                                        _17352 = 0.0;
                                        break;
                                    }
                                    vec3 _21278;
                                    if (_12217 < 0.0)
                                    {
                                        float _25066 = _12685.z;
                                        _21278 = ((_11357 * _25066) - (_12685 * _12217)) / vec3(_25066 - _12217);
                                    }
                                    else
                                    {
                                        _21278 = _11357;
                                    }
                                    float _10350 = _12685.z;
                                    vec3 _9003;
                                    if (_10350 < 0.0)
                                    {
                                        _9003 = (((-_21278) * _10350) + (_12685 * _21278.z)) / vec3(_21278.z - _10350);
                                    }
                                    else
                                    {
                                        _9003 = _12685;
                                    }
                                    float _12254 = dot(_21278, _23093);
                                    float _21074 = dot(_9003, _23093);
                                    vec3 _12177 = _21278 - (_23093 * _12254);
                                    float _16884 = length(_12177);
                                    float _13332 = _16884 * _16884;
                                    float _18323 = _21074 * _21074;
                                    float _10249 = _16884 * (_13332 + _18323);
                                    float _18434 = _21074 / _16884;
                                    float _8456 = abs(_18434);
                                    bool _14672 = _8456 < 1.0;
                                    float _11313;
                                    if (_14672)
                                    {
                                        _11313 = _8456;
                                    }
                                    else
                                    {
                                        _11313 = 1.0 / _8456;
                                    }
                                    float _23072 = _11313 * _11313;
                                    float _12283 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23072)) * _23072)) * _11313;
                                    float _14124;
                                    if (_14672)
                                    {
                                        _14124 = _12283;
                                    }
                                    else
                                    {
                                        _14124 = 1.57079601287841796875 - _12283;
                                    }
                                    float _10594 = _12254 * _12254;
                                    float _10250 = _16884 * (_13332 + _10594);
                                    float _18435 = _12254 / _16884;
                                    float _8457 = abs(_18435);
                                    bool _14673 = _8457 < 1.0;
                                    float _11314;
                                    if (_14673)
                                    {
                                        _11314 = _8457;
                                    }
                                    else
                                    {
                                        _11314 = 1.0 / _8457;
                                    }
                                    float _23073 = _11314 * _11314;
                                    float _12284 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23073)) * _23073)) * _11314;
                                    float _14125;
                                    if (_14673)
                                    {
                                        _14125 = _12284;
                                    }
                                    else
                                    {
                                        _14125 = 1.57079601287841796875 - _12284;
                                    }
                                    _17352 = (((((_21074 / _10249) + (uintBitsToFloat((floatBitsToUint(_14124) & 2147483647u) | (floatBitsToUint(_18434) & 2147483648u)) / _13332)) - ((_12254 / _10250) + (uintBitsToFloat((floatBitsToUint(_14125) & 2147483647u) | (floatBitsToUint(_18435) & 2147483648u)) / _13332))) * _12177.z) + (((_18323 / _10249) - (_10594 / _10250)) * _23093.z)) * 0.3183098733425140380859375;
                                    break;
                                } while(false);
                                vec3 _20421 = normalize(cross(_10770, _22054));
                                _23854[0].x = 1.0;
                                _23854[0].y = 0.0;
                                _23854[0].z = 0.0;
                                _23854[1].x = 0.0;
                                _23854[1].y = 1.0;
                                _23854[1].z = 0.0;
                                _23854[2].x = 0.0;
                                _23854[2].y = 0.0;
                                _23854[2].z = 1.0;
                                float _9743;
                                if (_13144)
                                {
                                    vec3 _11631 = normalize(_22054 - _10770);
                                    vec3 _16949 = normalize(_10770);
                                    vec3 _13616 = normalize(_22054);
                                    vec3 _17397 = _16949 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                                    float _17999 = length(_17397);
                                    float _23257 = determinant(mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0)));
                                    float _19894 = abs(_23257);
                                    vec3 _7986 = _13616 * mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0));
                                    float _24018 = length(_7986);
                                    _9743 = ((3.1415927410125732421875 * g_BarnLights_1._m0[_12608]._m18.w) * g_BarnLights_1._m0[_12608]._m18.w) * ((((((0.3183098733425140380859375 * max(0.0, _17397.z / _17999)) * _19894) / ((_17999 * _17999) * _17999)) * max(0.0, dot(_11631, _16949))) / dot(_10770, _10770)) + (((((0.3183098733425140380859375 * max(0.0, _7986.z / _24018)) * _19894) / ((_24018 * _24018) * _24018)) * max(0.0, dot(-_11631, _13616))) / dot(_22054, _22054)));
                                }
                                else
                                {
                                    _9743 = 0.0;
                                }
                                float _12508;
                                SPIRV_CROSS_BRANCH
                                if (_20900)
                                {
                                    mat3 _23397 = mat3(vec3(_14620.x, 0.0, _14620.z), vec3(0.0, 1.0, 0.0), vec3(_14620.y, 0.0, _14620.w));
                                    vec3 _15919 = _10770 * _23397;
                                    vec3 _6268 = _22054 * _23397;
                                    float _18802;
                                    do
                                    {
                                        vec3 _23094 = normalize(_6268 - _15919);
                                        float _12218 = _15919.z;
                                        bool _12896;
                                        if (_12218 <= 0.0)
                                        {
                                            _12896 = _6268.z <= 0.0;
                                        }
                                        else
                                        {
                                            _12896 = false;
                                        }
                                        if (_12896)
                                        {
                                            _18802 = 0.0;
                                            break;
                                        }
                                        vec3 _21279;
                                        if (_12218 < 0.0)
                                        {
                                            float _25067 = _6268.z;
                                            _21279 = ((_15919 * _25067) - (_6268 * _12218)) / vec3(_25067 - _12218);
                                        }
                                        else
                                        {
                                            _21279 = _15919;
                                        }
                                        float _10351 = _6268.z;
                                        vec3 _9004;
                                        if (_10351 < 0.0)
                                        {
                                            _9004 = (((-_21279) * _10351) + (_6268 * _21279.z)) / vec3(_21279.z - _10351);
                                        }
                                        else
                                        {
                                            _9004 = _6268;
                                        }
                                        float _12255 = dot(_21279, _23094);
                                        float _21075 = dot(_9004, _23094);
                                        vec3 _12178 = _21279 - (_23094 * _12255);
                                        float _16887 = length(_12178);
                                        float _13333 = _16887 * _16887;
                                        float _18324 = _21075 * _21075;
                                        float _10251 = _16887 * (_13333 + _18324);
                                        float _18436 = _21075 / _16887;
                                        float _8458 = abs(_18436);
                                        bool _14678 = _8458 < 1.0;
                                        float _11315;
                                        if (_14678)
                                        {
                                            _11315 = _8458;
                                        }
                                        else
                                        {
                                            _11315 = 1.0 / _8458;
                                        }
                                        float _23074 = _11315 * _11315;
                                        float _12287 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23074)) * _23074)) * _11315;
                                        float _14126;
                                        if (_14678)
                                        {
                                            _14126 = _12287;
                                        }
                                        else
                                        {
                                            _14126 = 1.57079601287841796875 - _12287;
                                        }
                                        float _10595 = _12255 * _12255;
                                        float _10252 = _16887 * (_13333 + _10595);
                                        float _18437 = _12255 / _16887;
                                        float _8459 = abs(_18437);
                                        bool _14682 = _8459 < 1.0;
                                        float _11316;
                                        if (_14682)
                                        {
                                            _11316 = _8459;
                                        }
                                        else
                                        {
                                            _11316 = 1.0 / _8459;
                                        }
                                        float _23075 = _11316 * _11316;
                                        float _12288 = (1.0 + (((-0.3018949925899505615234375) + (0.087292902171611785888671875 * _23075)) * _23075)) * _11316;
                                        float _14127;
                                        if (_14682)
                                        {
                                            _14127 = _12288;
                                        }
                                        else
                                        {
                                            _14127 = 1.57079601287841796875 - _12288;
                                        }
                                        _18802 = (((((_21075 / _10251) + (uintBitsToFloat((floatBitsToUint(_14126) & 2147483647u) | (floatBitsToUint(_18436) & 2147483648u)) / _13333)) - ((_12255 / _10252) + (uintBitsToFloat((floatBitsToUint(_14127) & 2147483647u) | (floatBitsToUint(_18437) & 2147483648u)) / _13333))) * _12178.z) + (((_18324 / _10251) - (_10595 / _10252)) * _23094.z)) * 0.3183098733425140380859375;
                                        break;
                                    } while(false);
                                    mat3 _19507 = transpose(_23397);
                                    vec3 _24914 = _19507[0];
                                    float _8812 = _24914.x;
                                    vec3 _22236 = _19507[1];
                                    float _22237 = _22236.x;
                                    vec3 _22238 = _19507[2];
                                    float _22239 = _22238.x;
                                    float _22240 = _24914.y;
                                    float _22242 = _22236.y;
                                    float _22243 = _22238.y;
                                    float _22244 = _24914.z;
                                    float _23223 = _22236.z;
                                    float _14227 = _22238.z;
                                    float _19644 = (_22242 * _14227) - (_22243 * _23223);
                                    float _19645 = (_22239 * _23223) - (_22237 * _14227);
                                    float _19646 = (_22237 * _22243) - (_22239 * _22242);
                                    float _15677 = 1.0 / (((_8812 * _19644) + (_22240 * _19645)) + (_22244 * _19646));
                                    _20506[0].x = _19644 * _15677;
                                    _20506[0].y = ((_22243 * _22244) - (_22240 * _14227)) * _15677;
                                    _20506[0].z = ((_22240 * _23223) - (_22242 * _22244)) * _15677;
                                    _20506[1].x = _19645 * _15677;
                                    _20506[1].y = ((_8812 * _14227) - (_22239 * _22244)) * _15677;
                                    _20506[1].z = ((_22237 * _22244) - (_8812 * _23223)) * _15677;
                                    _20506[2].x = _19646 * _15677;
                                    _20506[2].y = ((_22239 * _22240) - (_8812 * _22243)) * _15677;
                                    _20506[2].z = ((_8812 * _22242) - (_22237 * _22240)) * _15677;
                                    float _9744;
                                    if (_13144)
                                    {
                                        vec3 _11632 = normalize(_22054 - _10770);
                                        vec3 _16950 = normalize(_10770);
                                        vec3 _13617 = normalize(_22054);
                                        vec3 _17398 = _16950 * _23397;
                                        float _18000 = length(_17398);
                                        float _19895 = abs(determinant(_23397));
                                        vec3 _7987 = _13617 * _23397;
                                        float _24019 = length(_7987);
                                        _9744 = ((3.1415927410125732421875 * g_BarnLights_1._m0[_12608]._m18.w) * g_BarnLights_1._m0[_12608]._m18.w) * ((((((0.3183098733425140380859375 * max(0.0, _17398.z / _18000)) * _19895) / ((_18000 * _18000) * _18000)) * max(0.0, dot(_11632, _16950))) / dot(_10770, _10770)) + (((((0.3183098733425140380859375 * max(0.0, _7987.z / _24019)) * _19895) / ((_24019 * _24019) * _24019)) * max(0.0, dot(-_11632, _13617))) / dot(_22054, _22054)));
                                    }
                                    else
                                    {
                                        _9744 = 0.0;
                                    }
                                    _12508 = min(1.0, (g_BarnLights_1._m0[_12608]._m18.w * ((1.0 / length(_20421 * _20506)) * _18802)) + _9744);
                                }
                                else
                                {
                                    _12508 = 0.0;
                                }
                                _13215 = _12508;
                                _15678 = min(1.0, (g_BarnLights_1._m0[_12608]._m18.w * ((1.0 / length(_20421 * _23854)) * _17352)) + _9743);
                            }
                            else
                            {
                                _13215 = 0.0;
                                _15678 = 0.0;
                            }
                            _13216 = _13215;
                            _15679 = _15678;
                        }
                        _13174 = _13216;
                        _16055 = _15679;
                    }
                    float _13157;
                    vec3 _16316;
                    vec3 _16483;
                    vec3 _17191;
                    if (_10021)
                    {
                        vec3 _19539 = _14469 * _16055;
                        _13157 = _13141 + dot(_19539.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        _16316 = _16309.xyz + _19539;
                        _17191 = _17118;
                        _16483 = _17119;
                    }
                    else
                    {
                        _13157 = _13141;
                        _16316 = _16309;
                        _17191 = _17118.xyz + ((mix(_19659.xxx, _19659.yyy, _22671.xyz) * _14469).xyz * _13174);
                        _16483 = _17119.xyz + (_14469 * _16055);
                    }
                    _13159 = _13157;
                    _16318 = _16316;
                    _17125 = _17191;
                    _17193 = _16483;
                    _16488 = _21712;
                    break;
                }
                vec3 _13343 = mix(_12688, _17641, _20337);
                vec3 _15462 = mix(_17892, _13343, bvec3(all(equal(_17892, vec3(1.0)))));
                float _13812 = max(0.0, dot(_13343.xyz, _11179.xyz));
                vec3 _17883 = vec3(_13812);
                vec3 _12904;
                if (_13694 > 0.0)
                {
                    float _8781 = dot(_15462, _11179.xyz);
                    float _8125 = saturate(_13694);
                    _12904 = mix(_17883.xyz, vec3((((0.5 + (_13812 * 0.5)) + pow(1.0 - saturate(_8781), 4.0)) * saturate((_8781 + 0.20000000298023223876953125) * 4.0)) * saturate(mix(dot(mix(_13343, _15462, vec3(10.0)), _11179.xyz), 1.0, _8125))), vec3(_8125));
                }
                else
                {
                    _12904 = _17883;
                }
                vec3 _12905;
                SPIRV_CROSS_BRANCH
                if (_20900)
                {
                    vec2 _16492 = max(_11004, vec2(g_BarnLights_1._m0[_12608]._m11));
                    vec3 _21890 = _13372.xyz;
                    vec3 _12282 = normalize(_11179.xyz + _21890).xyz;
                    vec3 _19014 = _15462.xyz;
                    float _12387 = dot(_12282, _19014);
                    float _9851 = _16492.x;
                    float _25212 = _9851 * _9851;
                    float _24199 = _25212 / (((_12387 * _12387) * ((_25212 * _25212) - 1.0)) + 1.0);
                    float _16151 = _9851 + 1.0;
                    float _6836 = (_16151 * _16151) * 0.125;
                    float _19571 = 1.0 - _6836;
                    _12905 = ((_22671.xyz + ((vec3(1.0) - _22671.xyz) * pow(max(9.9999999747524270787835121154785e-07, 1.0 - max(0.0, dot(_11179.xyz, _12282))), 5.0))) * ((_24199 * _24199) / ((4.0 * ((_13812 * _19571) + _6836)) * ((max(0.0, dot(_19014, _21890)) * _19571) + _6836)))).xyz * _13812;
                }
                else
                {
                    _12905 = vec3(0.0);
                }
                float _13158;
                vec3 _16317;
                vec3 _16484;
                vec3 _17192;
                if (_10021)
                {
                    vec3 _12763 = _12904.xyz * _7427.xyz;
                    _13158 = _13141 + dot(_12763.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                    _16317 = _16309.xyz + _12763;
                    _17192 = _17118;
                    _16484 = _17119;
                }
                else
                {
                    _13158 = _13141;
                    _16317 = _16309;
                    _17192 = _17118.xyz + (_12905.xyz * _7427.xyz);
                    _16484 = _17119.xyz + (_12904.xyz * _7427.xyz);
                }
                _13159 = _13158;
                _16318 = _16317;
                _17125 = _17192;
                _17193 = _16484;
                _16488 = _21712;
                break;
            } while(false);
            _13141 = _13159;
            _16309 = _16318;
            _17118 = _17125;
            _17119 = _17193;
            _17134 = _16488;
            _17018 = _20344;
            continue;
        }
        _21567 = _17017 + 1u;
        _13140 = _17134;
        _16308 = _17119;
        _17116 = _16309;
        _17117 = _13141;
        _17133 = _17118;
        _17017 = _21567;
        continue;
    }
    bool _12989 = _24467.y;
    vec3 _23131;
    if (_12989)
    {
        float _17138 = _11004.x + _11004.y;
        float _19582 = _17138 * _17138;
        _23131 = _17133 * (vec3(1.0) + (_22671 * ((0.125 * (_19582 * _19582)) * saturate(dot(_17892, -normalize(_20327.xyz - PerViewConstantBuffer_t._m7.xyz))))));
    }
    else
    {
        _23131 = _17133;
    }
    vec3 _23891 = mix(_17892, _17641, _20337);
    float _20691 = dot(_11004.xy, vec2(0.5));
    bool _21357 = _Globals_.g_bCubemapNormalization != 0;
    vec3 _17139 = normalize(_20327.xyz - PerViewConstantBuffer_t._m7.xyz);
    vec3 _24025 = _17139.xyz;
    vec3 _23519 = _23891.xyz;
    bool _10597;
    if (_21357)
    {
        _10597 = _21357;
    }
    else
    {
        _10597 = false;
    }
    float _12853 = PerViewLightingConstantBufferGpu_t._m14.y * sqrt(_20691);
    vec3 _11901 = _20327.xyz;
    bool _11914 = PerViewConstantBufferCsgo_t._m29 != 0.0;
    vec3 _11008;
    vec4 _14444;
    if (_11914)
    {
        float _9642 = dot(vec4(((_11901 + PerViewConstantBuffer_t._m6.xyz) + ((-PerViewConstantBuffer_t._m8) * PerViewConstantBufferCsgo_t._m29)).xyz, 1.0), vec4(PerViewConstantBuffer_t._m8.xyz, dot((PerViewConstantBuffer_t._m6.xyz + PerViewConstantBuffer_t._m7.xyz).xyz + (PerViewConstantBuffer_t._m8.xyz * PerViewConstantBuffer_t._m5), PerViewConstantBuffer_t._m8.xyz)));
        vec3 _21713;
        if (_9642 <= 0.0)
        {
            _21713 = _20327;
        }
        else
        {
            _21713 = _11901 + ((-PerViewConstantBuffer_t._m8.xyz) * _9642);
        }
        vec4 _19975 = vec4(_21713.xyz, 1.0) * PerViewConstantBufferCsgo_t._m15;
        float _20177 = _19975.w;
        vec2 _11417 = _19975.xy / vec2(_20177);
        vec4 _6652;
        _6652.x = clamp(((_11417.x + 1.0) * PerViewConstantBuffer_t._m3.x) * 0.5, 0.0, PerViewConstantBuffer_t._m3.x - 1.0);
        _6652.y = clamp(((1.0 - _11417.y) * PerViewConstantBuffer_t._m3.y) * 0.5, 0.0, PerViewConstantBuffer_t._m3.y - 1.0);
        _6652.w = _20177;
        _11008 = _21713;
        _14444 = _6652;
    }
    else
    {
        _11008 = _11901;
        _14444 = _11408.xyzw;
    }
    float _22047 = _20691 * _20691;
    float _20711 = saturate(1.0 - _22047);
    vec3 _25271 = normalize(mix(_23891.xyz, reflect(_24025, _23519).xyz, vec3(_20711 * (sqrt(_20711) + _22047))));
    uvec2 _6815 = uvec2(_14444.xy - PerViewConstantBuffer_t._m2.xy) >> _7663;
    uint _12130 = PerViewLightingConstantBufferGpu_t._m11.y + (((_6815.y * PerViewLightingConstantBufferGpu_t._m12.y) + _6815.x) * PerViewLightingConstantBufferGpu_t._m11.z);
    uint _23394 = PerViewLightingConstantBufferGpu_t._m11.x + (uint(clamp(_14444.w * PerViewLightingConstantBufferGpu_t._m13.x, 0.0, PerViewLightingConstantBufferGpu_t._m13.y)) * PerViewLightingConstantBufferGpu_t._m11.z);
    vec4 _13160;
    float _16319;
    vec3 _17126;
    _13160 = vec4(0.0);
    _16319 = 0.00999999977648258209228515625;
    _17126 = vec3(0.0);
    uint _8896;
    vec4 _13164;
    vec3 _14891;
    float _16321;
    bool _18380;
    uint _17024 = 0u;
    bool _17137 = false;
    for (;;)
    {
        bool _12906;
        if (_17024 < PerViewLightingConstantBufferGpu_t._m11.z)
        {
            _12906 = !_17137;
        }
        else
        {
            _12906 = false;
        }
        if (!_12906)
        {
            break;
        }
        uint _14476 = subgroupOr(g_CullBits_1._m0[_12130 + _17024] & g_CullBits_1._m0[_23394 + _17024]);
        vec3 _13161;
        vec4 _16320;
        _13161 = _17126;
        _16320 = _13160;
        uint _10156;
        vec3 _13163;
        vec4 _16382;
        float _16489;
        uint _17025 = _14476;
        float _17140 = _16319;
        for (;;)
        {
            if (!(_17025 != 0u))
            {
                _13164 = _16320;
                _16321 = _17140;
                _14891 = _13161;
                _18380 = _17137;
                break;
            }
            uint _18154 = uint(findLSB(_17025));
            int _12609 = int(_18154 + (_17024 * 32u));
            _10156 = _17025 & (_17025 - 1u);
            vec3 _7748 = (PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m0 * vec4(_11008.xyz, 1.0)).xyz;
            vec3 _8793 = saturate((_7748 - PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m1) * PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m5.xyz);
            vec3 _19651 = saturate((PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m3 - _7748) * PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m5.xyz);
            float _17265 = min(min(_8793.x, min(_8793.y, _8793.z)), min(_19651.x, min(_19651.y, _19651.z)));
            if (_17265 == 0.0)
            {
                _13163 = _13161;
                _16382 = _16320;
                _16489 = _17140;
                _13161 = _13163;
                _16320 = _16382;
                _17140 = _16489;
                _17025 = _10156;
                continue;
            }
            vec3 _19630;
            if (PerViewConstantBufferCsgo_t._m28 != 0.0)
            {
                vec3 _19783 = PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m1 + ((PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m3 - PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m1) * 0.5);
                _19630 = ((_7748 - _19783) * PerViewConstantBufferCsgo_t._m28) + _19783;
            }
            else
            {
                _19630 = _7748;
            }
            vec3 _7648 = (PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m0 * vec4(_25271.xyz, 0.0)).xyz;
            vec3 _11253 = max(((PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m3.xyz - _19630.xyz) / _7648).xyz, ((PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m1.xyz - _19630.xyz) / _7648).xyz);
            float _11076 = ((_17265 * _17265) * (((-2.0) * _17265) + 3.0)) * (1.0 - _17140);
            float _13713 = _17140 + _11076;
            vec3 _15431 = _13161 + ((textureLod(samplerCubeArray(g_bindless_TextureCubeArray[PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m4], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), vec4(mix(_19630.xyz + (_7648 * abs(min(_11253.x, min(_11253.y, _11253.z)))), _7648, vec3(_20691)).xyz, float(PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m2)), _12853).xyz * PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m6) * _11076);
            vec4 _7460 = _16320 + (PerViewLightingConstantBufferGpu_t._m15._m0[_12609]._m7 * _11076);
            if (_13713 > 0.9900000095367431640625)
            {
                _13164 = _7460;
                _16321 = _13713;
                _14891 = _15431;
                _18380 = true;
                break;
            }
            _13163 = _15431;
            _16382 = _7460;
            _16489 = _13713;
            _13161 = _13163;
            _16320 = _16382;
            _17140 = _16489;
            _17025 = _10156;
            continue;
        }
        _8896 = _17024 + 1u;
        _13160 = _13164;
        _16319 = _16321;
        _17126 = _14891;
        _17137 = _18380;
        _17024 = _8896;
        continue;
    }
    vec3 _14337 = _17126 / vec3(_16319);
    vec3 _12907;
    if (_10597)
    {
        _12907 = _14337.xyz * min(_17117 / dot(vec4(_23519, 1.0), (_13160 / vec4(_16319)).xyzw), max((_20691 * PerViewLightingConstantBufferGpu_t._m4.x) + PerViewLightingConstantBufferGpu_t._m4.y, 1.0));
    }
    else
    {
        _12907 = _14337;
    }
    bool _14877;
    vec3 _11325;
    do
    {
        _14877 = _Globals_.g_bRenderingToCubemaps != 0;
        if (_14877)
        {
            _11325 = _17116.xyz * mix(PerViewConstantBufferCsgo_t._m31, 1.0, _20691);
            break;
        }
        _11325 = _12907.xyz;
        break;
    } while(false);
    vec3 _23409 = -_17139;
    vec3 _24855 = _23409.xyz;
    vec4 _11487 = textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sBilinearClamp]), vec3((vec2(_20691, sqrt(1.0 - max(0.0, dot(_24855, _17892.xyz)))) * 0.984375) + vec2(0.0078125), 1.0).xyz, 0.0);
    vec3 _19581 = mix(_11487.xxx, _11487.yyy, _22671);
    vec3 _10086 = _19581 * _11325;
    vec3 _9717;
    vec3 _24879;
    if (_12989)
    {
        float _8031 = 1.0 - _11487.y;
        vec3 _15517 = _22671 + ((vec3(1.0) - _22671) * vec3(0.0476190485060214996337890625));
        vec3 _22440 = ((_19581 * _15517) / (vec3(1.0) - (_15517 * _8031))) * _8031;
        _9717 = _10086 + (_22440 * _11325);
        _24879 = _17116 * (vec3(1.0) - (_19581 + _22440));
    }
    else
    {
        _9717 = _10086;
        _24879 = _17116;
    }
    float _11966 = PerViewLightingConstantBufferGpu_t._m14.y * sqrt(PerViewConstantBufferCsgo_t._m30);
    vec3 _11009;
    vec4 _14445;
    if (_11914)
    {
        float _9643 = dot(vec4(((_11901 + PerViewConstantBuffer_t._m6.xyz) + ((-PerViewConstantBuffer_t._m8) * PerViewConstantBufferCsgo_t._m29)).xyz, 1.0), vec4(PerViewConstantBuffer_t._m8.xyz, dot((PerViewConstantBuffer_t._m6.xyz + PerViewConstantBuffer_t._m7.xyz).xyz + (PerViewConstantBuffer_t._m8.xyz * PerViewConstantBuffer_t._m5), PerViewConstantBuffer_t._m8.xyz)));
        vec3 _21715;
        if (_9643 <= 0.0)
        {
            _21715 = _20327;
        }
        else
        {
            _21715 = _11901 + ((-PerViewConstantBuffer_t._m8.xyz) * _9643);
        }
        vec4 _19976 = vec4(_21715.xyz, 1.0) * PerViewConstantBufferCsgo_t._m15;
        float _20178 = _19976.w;
        vec2 _11418 = _19976.xy / vec2(_20178);
        vec4 _6653;
        _6653.x = clamp(((_11418.x + 1.0) * PerViewConstantBuffer_t._m3.x) * 0.5, 0.0, PerViewConstantBuffer_t._m3.x - 1.0);
        _6653.y = clamp(((1.0 - _11418.y) * PerViewConstantBuffer_t._m3.y) * 0.5, 0.0, PerViewConstantBuffer_t._m3.y - 1.0);
        _6653.w = _20178;
        _11009 = _21715;
        _14445 = _6653;
    }
    else
    {
        _11009 = _11901;
        _14445 = _11408.xyzw;
    }
    float _22048 = PerViewConstantBufferCsgo_t._m30 * PerViewConstantBufferCsgo_t._m30;
    float _20713 = saturate(1.0 - _22048);
    vec3 _25272 = normalize(mix(_17641, reflect(_24025, _10560).xyz, vec3(_20713 * (sqrt(_20713) + _22048))));
    uvec2 _6816 = uvec2(_14445.xy - PerViewConstantBuffer_t._m2.xy) >> _7663;
    uint _14522 = PerViewLightingConstantBufferGpu_t._m11.y + (((_6816.y * PerViewLightingConstantBufferGpu_t._m12.y) + _6816.x) * PerViewLightingConstantBufferGpu_t._m11.z);
    uint _7533 = PerViewLightingConstantBufferGpu_t._m11.x + (uint(clamp(_14445.w * PerViewLightingConstantBufferGpu_t._m13.x, 0.0, PerViewLightingConstantBufferGpu_t._m13.y)) * PerViewLightingConstantBufferGpu_t._m11.z);
    float _13165;
    vec4 _16322;
    float _17127;
    vec3 _17128;
    _13165 = 0.0;
    _16322 = vec4(0.0);
    _17127 = 0.00999999977648258209228515625;
    _17128 = vec3(0.0);
    uint _8897;
    float _13169;
    vec3 _14892;
    vec4 _16325;
    float _17130;
    bool _18381;
    uint _17026 = 0u;
    bool _17141 = false;
    for (;;)
    {
        bool _12908;
        if (_17026 < PerViewLightingConstantBufferGpu_t._m11.z)
        {
            _12908 = !_17141;
        }
        else
        {
            _12908 = false;
        }
        if (!_12908)
        {
            break;
        }
        uint _14477 = subgroupOr(g_CullBits_1._m0[_14522 + _17026] & g_CullBits_1._m0[_7533 + _17026]);
        vec3 _13166;
        vec4 _17129;
        _13166 = _17128;
        _17129 = _16322;
        uint _18156;
        vec3 _13168;
        float _16324;
        float _16490;
        vec4 _17194;
        float _16323 = _13165;
        uint _17027 = _14477;
        float _17142 = _17127;
        for (;;)
        {
            if (!(_17027 != 0u))
            {
                _13169 = _16323;
                _16325 = _17129;
                _17130 = _17142;
                _14892 = _13166;
                _18381 = _17141;
                break;
            }
            uint _18155 = uint(findLSB(_17027));
            int _12610 = int(_18155 + (_17026 * 32u));
            _18156 = _17027 & (_17027 - 1u);
            vec3 _7749 = (PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m0 * vec4(_11009.xyz, 1.0)).xyz;
            vec3 _8794 = saturate((_7749 - PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m1) * PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m5.xyz);
            vec3 _19654 = saturate((PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m3 - _7749) * PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m5.xyz);
            float _17266 = min(min(_8794.x, min(_8794.y, _8794.z)), min(_19654.x, min(_19654.y, _19654.z)));
            if (_17266 == 0.0)
            {
                _13168 = _13166;
                _16324 = _16323 + 0.100000001490116119384765625;
                _17194 = _17129;
                _16490 = _17142;
                _13166 = _13168;
                _16323 = _16324;
                _17129 = _17194;
                _17142 = _16490;
                _17027 = _18156;
                continue;
            }
            float _14608 = _16323 + 1.10000002384185791015625;
            vec3 _19631;
            if (PerViewConstantBufferCsgo_t._m28 != 0.0)
            {
                vec3 _19784 = PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m1 + ((PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m3 - PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m1) * 0.5);
                _19631 = ((_7749 - _19784) * PerViewConstantBufferCsgo_t._m28) + _19784;
            }
            else
            {
                _19631 = _7749;
            }
            vec3 _7653 = (PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m0 * vec4(_25272.xyz, 0.0)).xyz;
            vec3 _11254 = max(((PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m3.xyz - _19631.xyz) / _7653).xyz, ((PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m1.xyz - _19631.xyz) / _7653).xyz);
            float _11077 = ((_17266 * _17266) * (((-2.0) * _17266) + 3.0)) * (1.0 - _17142);
            float _13714 = _17142 + _11077;
            vec3 _15432 = _13166 + ((textureLod(samplerCubeArray(g_bindless_TextureCubeArray[PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m4], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), vec4(mix(_19631.xyz + (_7653 * abs(min(_11254.x, min(_11254.y, _11254.z)))), _7653, vec3(PerViewConstantBufferCsgo_t._m30)).xyz, float(PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m2)), _11966).xyz * PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m6) * _11077);
            vec4 _7461 = _17129 + (PerViewLightingConstantBufferGpu_t._m15._m0[_12610]._m7 * _11077);
            if (_13714 > 0.9900000095367431640625)
            {
                _13169 = _14608;
                _16325 = _7461;
                _17130 = _13714;
                _14892 = _15432;
                _18381 = true;
                break;
            }
            _13168 = _15432;
            _16324 = _14608;
            _17194 = _7461;
            _16490 = _13714;
            _13166 = _13168;
            _16323 = _16324;
            _17129 = _17194;
            _17142 = _16490;
            _17027 = _18156;
            continue;
        }
        _8897 = _17026 + 1u;
        _13165 = _13169;
        _16322 = _16325;
        _17127 = _17130;
        _17128 = _14892;
        _17141 = _18381;
        _17026 = _8897;
        continue;
    }
    vec3 _14338 = _17128 / vec3(_17127);
    vec3 _12909;
    if (_21357)
    {
        _12909 = _14338.xyz * min(1.0 / dot(vec4(_17641.xyz, 1.0), (_16322 / vec4(_17127)).xyzw), max((PerViewConstantBufferCsgo_t._m30 * PerViewLightingConstantBufferGpu_t._m4.x) + PerViewLightingConstantBufferGpu_t._m4.y, 1.0));
    }
    else
    {
        _12909 = _14338;
    }
    vec3 _19323;
    do
    {
        if (_14877)
        {
            _19323 = _24879.xyz * 1.0;
            break;
        }
        _19323 = _12909.xyz;
        break;
    } while(false);
    float _15896 = _21711 * _17476;
    vec3 _23045 = vec3(_15896);
    vec3 _13436 = _23045.xyz;
    vec3 _17067 = _16308.xyz + (_24879.xyz * _13436).xyz;
    vec3 _22686 = _17067 * (_20195.xyz * pow(1.0 - _20079, _Globals_.g_flMetalnessTransitionBias)).xyz;
    float _12931 = _22686.x;
    vec4 _11206 = vec4(_12931, _22686.yz, input_4.w);
    _11206.x = _12931;
    _11206.y = _22686.y;
    _11206.z = _22686.z;
    vec3 _15779 = (_23131.xyz * _13436).xyz;
    vec3 _15752 = _11206.xyz + _15779;
    vec4 _20493 = _11206;
    _20493.x = _15752.x;
    _20493.y = _15752.y;
    _20493.z = _15752.z;
    vec3 _15780 = (_9717.xyz * _13436).xyz;
    vec3 _15733 = _20493.xyz + _15780;
    vec4 _13894 = _20493;
    _13894.x = _15733.x;
    _13894.y = _15733.y;
    _13894.z = _15733.z;
    vec4 _21377;
    if (_Globals_.g_bFogEnabled != 0)
    {
        vec3 _21493;
        vec3 _23187 = _11901 - PerViewConstantBuffer_t._m7.xyz;
        vec3 _9059 = _23187.xyz;
        vec3 _19340;
        do
        {
            _21493 = _23187.xyz;
            bool _12913;
            if (dot(_21493, _21493) > PerViewConstantBufferCsgo_t._m21.x)
            {
                _12913 = (_20327.z * PerViewConstantBufferCsgo_t._m21.z) < PerViewConstantBufferCsgo_t._m21.y;
            }
            else
            {
                _12913 = false;
            }
            SPIRV_CROSS_BRANCH
            if (_12913)
            {
                float _17979 = length(_21493);
                vec2 _9342 = saturate(PerViewConstantBufferCsgo_t._m18.xy + (PerViewConstantBufferCsgo_t._m18.zw * vec2(mix(_17979, _17979 * PerViewConstantBufferCsgo_t._m32.y, _Globals_.g_flFogModificationAmount), _20327.z)));
                float _13533 = (pow(_9342.x, PerViewConstantBufferCsgo_t._m19.x) * pow(_9342.y, PerViewConstantBufferCsgo_t._m19.y)) * PerViewConstantBufferCsgo_t._m20.w;
                float _12715 = mix(_13533, _13533 * PerViewConstantBufferCsgo_t._m32.z, _Globals_.g_flFogModificationAmount);
                _19340 = mix(_13894.xyz, vec4(PerViewConstantBufferCsgo_t._m20.xyz, _12715).xyz, vec3(_12715));
                break;
            }
            _19340 = _13894.xyz;
            break;
        } while(false);
        vec4 _23944 = _13894;
        _23944.x = _19340.x;
        _23944.y = _19340.y;
        _23944.z = _19340.z;
        vec3 _19341;
        do
        {
            bool _12914;
            if (dot(_9059, _9059) > PerViewConstantBufferCsgo_t._m25.x)
            {
                _12914 = (PerViewConstantBufferCsgo_t._m25.z * _20327.z) < PerViewConstantBufferCsgo_t._m25.y;
            }
            else
            {
                _12914 = false;
            }
            if (_12914)
            {
                float _17980 = length(_21493);
                float _14602 = saturate(pow(max(0.0, (mix(_17980, _17980 * PerViewConstantBufferCsgo_t._m32.y, _Globals_.g_flFogModificationAmount) * PerViewConstantBufferCsgo_t._m22.y) + PerViewConstantBufferCsgo_t._m22.x), PerViewConstantBufferCsgo_t._m22.w)) * saturate(pow(max(0.0, (_20327.z * PerViewConstantBufferCsgo_t._m23.y) + PerViewConstantBufferCsgo_t._m23.x), PerViewConstantBufferCsgo_t._m23.z));
                float _16973 = saturate(_14602) * mix(PerViewConstantBufferCsgo_t._m25.w, PerViewConstantBufferCsgo_t._m25.w * PerViewConstantBufferCsgo_t._m32.z, _Globals_.g_flFogModificationAmount);
                _19341 = mix(_23944.xyz, vec4((textureLod(samplerCube(g_bindless_TextureCube_float4[PerViewConstantBufferCsgo_t._m6], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), normalize((PerViewConstantBufferCsgo_t._m24 * vec4(_9059, 0.0)).xyz).xyz, PerViewConstantBufferCsgo_t._m23.w * saturate(1.0 - (_14602 * PerViewConstantBufferCsgo_t._m22.z))) * PerViewConstantBufferCsgo_t._m26.x).xyz, _16973).xyz, vec3(_16973));
                break;
            }
            _19341 = _23944.xyz;
            break;
        } while(false);
        _23944.x = _19341.x;
        _23944.y = _19341.y;
        _23944.z = _19341.z;
        _21377 = _23944;
    }
    else
    {
        _21377 = _13894;
    }
    vec4 _9914 = _21377.xyzw;
    vec4 _21361;
    SPIRV_CROSS_FLATTEN
    if (_15571 != 0)
    {
        vec4 _11078 = _9914;
        _11078.x = 0.100000001490116119384765625;
        _11078.y = 0.100000001490116119384765625;
        _11078.z = 0.100000001490116119384765625;
        _21361 = _11078;
    }
    else
    {
        _21361 = _9914;
    }
    vec4 _10087 = _21361.xyzw;
    vec4 _21362;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 60)
    {
        vec3 _11003 = _Globals_.g_vFlatOverlayColor * max(0.20000000298023223876953125, ((_20195.x + _20195.y) + _20195.z) * 0.3333333432674407958984375);
        vec4 _8675 = _10087;
        _8675.x = _11003.x;
        _8675.y = _11003.y;
        _8675.z = _11003.z;
        _21362 = _8675;
    }
    else
    {
        _21362 = _10087;
    }
    vec4 _10088 = _21362.xyzw;
    vec4 _21363;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 1)
    {
        vec3 _22951 = _14786.xyz;
        vec3 _13406 = saturate(_22951);
        vec3 _23904 = saturate(-_22951);
        vec3 _17885 = ((_20195.xyz * (dot(vec3(0.60000002384185791015625, 0.4000000059604644775390625, 1.0), _13406 * _13406) + dot(vec3(0.60000002384185791015625, 0.4000000059604644775390625, 0.20000000298023223876953125), _23904 * _23904))) * mix(0.300000011920928955078125, 1.0, saturate(dot(_22951, _24855)))) + vec3(0.0500000007450580596923828125 * pow(saturate(dot(_24855, reflect(-_24855, _22951).xyz)), 4.0));
        vec4 _20494 = _10088;
        _20494.x = _17885.x;
        _20494.y = _17885.y;
        _20494.z = _17885.z;
        _21363 = _20494;
    }
    else
    {
        _21363 = _10088;
    }
    vec4 _10089 = _21363.xyzw;
    vec4 _21364;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 2)
    {
        vec4 _23135 = _10089;
        _23135.x = _17067.x;
        _23135.y = _17067.y;
        _23135.z = _17067.z;
        vec3 _22862 = _23135.xyz * 0.5;
        vec4 _8677 = _23135;
        _8677.x = _22862.x;
        _8677.y = _22862.y;
        _8677.z = _22862.z;
        _21364 = _8677;
    }
    else
    {
        _21364 = _10089;
    }
    vec4 _10090 = _21364.xyzw;
    vec4 _21365;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 3)
    {
        vec3 _20220 = _15779 + _15780;
        vec4 _20495 = _10090;
        _20495.x = _20220.x;
        _20495.y = _20220.y;
        _20495.z = _20220.z;
        _21365 = _20495;
    }
    else
    {
        _21365 = _10090;
    }
    vec4 _10092 = _21365.xyzw;
    vec4 _21368;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 4)
    {
        vec4 _11079 = _10092;
        _11079.x = 0.0;
        _11079.y = 0.0;
        _11079.z = 0.0;
        _21368 = _11079;
    }
    else
    {
        _21368 = _10092;
    }
    vec4 _10093 = _21368.xyzw;
    vec4 _7078;
    SPIRV_CROSS_BRANCH
    if (_15571 == 5)
    {
        float _10214 = saturate(saturate(_13140 / _Globals_.g_fToolsVisMaxLightingComplexity));
        float _21503 = _10214 * _10214;
        float _20302 = _21503 * _10214;
        vec4 _14651 = vec4(1.0, _10214, _21503, _20302);
        vec2 _10661 = vec2(_21503, _20302) * _21503;
        vec4 _19258 = _10093;
        _19258.x = dot(_14651, vec4(0.135721385478973388671875, 4.6153926849365234375, -42.6603240966796875, 132.1310882568359375)) + dot(_10661, vec2(-152.9423980712890625, 59.286380767822265625));
        _19258.y = dot(_14651, vec4(0.091402612626552581787109375, 2.1941883563995361328125, 4.842966556549072265625, -14.1850337982177734375)) + dot(_10661, vec2(4.277298450469970703125, 2.82956600189208984375));
        _19258.z = dot(_14651, vec4(0.106673300266265869140625, 12.64194583892822265625, -60.5820465087890625, 110.36277008056640625)) + dot(_10661, vec2(-89.903106689453125, 27.3482494354248046875));
        _7078 = _19258;
    }
    else
    {
        _7078 = _10093;
    }
    vec4 _21369;
    SPIRV_CROSS_BRANCH
    if (_15571 == 8)
    {
        float _10215 = saturate(saturate(_13165 / _Globals_.g_fToolsVisMaxLightingComplexity));
        float _21504 = _10215 * _10215;
        float _20303 = _21504 * _10215;
        vec4 _14652 = vec4(1.0, _10215, _21504, _20303);
        vec2 _10662 = vec2(_21504, _20303) * _21504;
        vec4 _19259 = _7078;
        _19259.x = dot(_14652, vec4(0.135721385478973388671875, 4.6153926849365234375, -42.6603240966796875, 132.1310882568359375)) + dot(_10662, vec2(-152.9423980712890625, 59.286380767822265625));
        _19259.y = dot(_14652, vec4(0.091402612626552581787109375, 2.1941883563995361328125, 4.842966556549072265625, -14.1850337982177734375)) + dot(_10662, vec2(4.277298450469970703125, 2.82956600189208984375));
        _19259.z = dot(_14652, vec4(0.106673300266265869140625, 12.64194583892822265625, -60.5820465087890625, 110.36277008056640625)) + dot(_10662, vec2(-89.903106689453125, 27.3482494354248046875));
        _21369 = _19259;
    }
    else
    {
        _21369 = _7078;
    }
    vec4 _10094 = _21369.xyzw;
    vec4 _22821;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 10)
    {
        float _16899 = dot(_20195.xyz, vec3(0.300000011920928955078125, 0.589999973773956298828125, 0.10999999940395355224609375));
        vec4 _7055 = _10094;
        _7055.x = _20195.x;
        _7055.y = _20195.y;
        _7055.z = _20195.z;
        float _20788 = step(0.75, PerViewConstantBuffer_t._m0 - 1.5 * trunc(PerViewConstantBuffer_t._m0 / 1.5));
        vec3 _10930 = mix(_7055.xyz, vec3(1.0, 0.0, _20079), vec3((0.699999988079071044921875 * step(mix(0.89999997615814208984375, 0.980000019073486328125, _20079), _16899)) * _20788));
        vec4 _17843 = _7055;
        _17843.x = _10930.x;
        _17843.y = _10930.y;
        _17843.z = _10930.z;
        vec3 _10931 = mix(_17843.xyz, vec3(_20079, 0.0, 1.0), vec3((0.699999988079071044921875 * step(_16899, mix(0.02999999932944774627685546875, 0.134000003337860107421875, _20079))) * _20788));
        vec4 _17844 = _17843;
        _17844.x = _10931.x;
        _17844.y = _10931.y;
        _17844.z = _10931.z;
        _22821 = _17844;
    }
    else
    {
        vec4 _12521;
        if (_15571 == 19)
        {
            vec4 _23136 = _10094;
            _23136.x = _20195.x;
            _23136.y = _20195.y;
            _23136.z = _20195.z;
            bool _24602 = any(isnan(_23136.xyz));
            bool _11907 = any(lessThan(_23136.xyz, vec3(0.0)));
            bool _20940 = any(isinf(_23136.xyz));
            vec3 _13563;
            if (_24602)
            {
                _13563 = vec3(0.5, 1.0, 0.0);
            }
            else
            {
                vec3 _12519;
                if (_11907)
                {
                    _12519 = vec3(1.0, 0.5, 0.0);
                }
                else
                {
                    vec3 _12518;
                    if (_20940)
                    {
                        _12518 = vec3(0.0, 1.0, 1.0);
                    }
                    else
                    {
                        _12518 = _23136.xyz;
                    }
                    _12519 = _12518;
                }
                _13563 = _12519;
            }
            vec3 _10929 = mix(_23136.xyz, _13563, vec3(step(0.75, PerViewConstantBuffer_t._m0 - 1.5 * trunc(PerViewConstantBuffer_t._m0 / 1.5)) * max(max(float(_24602), float(_11907)), float(_20940))));
            vec4 _17842 = _23136;
            _17842.x = _10929.x;
            _17842.y = _10929.y;
            _17842.z = _10929.z;
            _12521 = _17842;
        }
        else
        {
            _12521 = _10094;
        }
        _22821 = _12521;
    }
    vec4 _15894 = _22821.xyzw;
    vec4 _21372;
    SPIRV_CROSS_FLATTEN
    if (_23067)
    {
        float _8782 = dot(_20195.xyz, vec3(0.300000011920928955078125, 0.589999973773956298828125, 0.10999999940395355224609375));
        float _24906 = floor((_8782 * 20.0) + 0.5) * 0.0500000007450580596923828125;
        vec4 _20979 = _15894;
        _20979.x = _24906;
        _20979.y = _24906;
        _20979.z = _24906;
        float _20789 = step(0.75, PerViewConstantBuffer_t._m0 - 1.5 * trunc(PerViewConstantBuffer_t._m0 / 1.5));
        vec3 _10932 = mix(_20979.xyz, vec3(1.0, 0.0, _20079), vec3((0.699999988079071044921875 * step(mix(0.89999997615814208984375, 0.980000019073486328125, _20079), _8782)) * _20789));
        vec4 _17845 = _20979;
        _17845.x = _10932.x;
        _17845.y = _10932.y;
        _17845.z = _10932.z;
        vec3 _10933 = mix(_17845.xyz, vec3(_20079, 0.0, 1.0), vec3((0.699999988079071044921875 * step(_8782, mix(0.02999999932944774627685546875, 0.134000003337860107421875, _20079))) * _20789));
        vec4 _17846 = _17845;
        _17846.x = _10933.x;
        _17846.y = _10933.y;
        _17846.z = _10933.z;
        _21372 = _17846;
    }
    else
    {
        _21372 = _15894;
    }
    vec4 _10095 = _21372.xyzw;
    vec4 _21375;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 12)
    {
        float _16941 = dot(_16306.xy, vec2(0.5));
        vec4 _23850 = _10095;
        _23850.x = _16941;
        _23850.y = _16941;
        _23850.z = _16941;
        vec3 _12210 = _23850.xyz * vec3(0.077399380505084991455078125);
        vec3 _9357 = pow((_23850.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        bool _17060 = _16941 <= 0.040449999272823333740234375;
        float _12916;
        if (_17060)
        {
            _12916 = _12210.x;
        }
        else
        {
            _12916 = _9357.x;
        }
        float _12917;
        if (_17060)
        {
            _12917 = _12210.y;
        }
        else
        {
            _12917 = _9357.y;
        }
        float _19167;
        if (_17060)
        {
            _19167 = _12210.z;
        }
        else
        {
            _19167 = _9357.z;
        }
        _23850.x = _12916;
        _23850.y = _12917;
        _23850.z = _19167;
        _21375 = _23850;
    }
    else
    {
        _21375 = _10095;
    }
    vec4 _10096 = _21375.xyzw;
    vec4 _21376;
    if (_15571 == 81)
    {
        float _15242 = (clamp(0.0, -_Globals_.g_fToolsVisMaxHeightRange, _Globals_.g_fToolsVisMaxHeightRange) + _Globals_.g_fToolsVisMaxHeightRange) / (_Globals_.g_fToolsVisMaxHeightRange * 2.0);
        vec3 _23588 = mix(vec3(bvec3(all(bvec4(true)))) * _15242, vec3(_15242), vec3(_Globals_.g_fToolsVisHeightTint));
        vec4 _17847 = _10096;
        _17847.x = _23588.x;
        _17847.y = _23588.y;
        _17847.z = _23588.z;
        _21376 = _17847;
    }
    else
    {
        vec4 _12523;
        if (_15571 == 80)
        {
            vec4 _11080 = _10096;
            _11080.x = 0.0;
            _11080.y = 0.0;
            _11080.z = 0.0;
            _12523 = _11080;
        }
        else
        {
            _12523 = _10096;
        }
        _21376 = _12523;
    }
    vec4 _10097 = _21376.xyzw;
    vec4 _21380;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 13)
    {
        vec4 _11081 = _10097;
        _11081.x = 0.0199999995529651641845703125;
        _11081.y = 0.0199999995529651641845703125;
        _11081.z = 0.0199999995529651641845703125;
        vec3 _20304 = _11081.xyz * vec3(0.077399380505084991455078125);
        vec4 _13895 = _11081;
        _13895.x = _20304.x;
        _13895.y = _20304.y;
        _13895.z = _20304.z;
        _21380 = _13895;
    }
    else
    {
        _21380 = _10097;
    }
    vec4 _10098 = _21380.xyzw;
    vec4 _21381;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 14)
    {
        vec3 _8731 = _23045.xyz;
        vec3 _17249 = _8731 * vec3(0.077399380505084991455078125);
        vec3 _9358 = pow((_8731 * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        bool _17061 = _15896 <= 0.040449999272823333740234375;
        float _12918;
        if (_17061)
        {
            _12918 = _17249.x;
        }
        else
        {
            _12918 = _9358.x;
        }
        float _12919;
        if (_17061)
        {
            _12919 = _17249.y;
        }
        else
        {
            _12919 = _9358.y;
        }
        float _19168;
        if (_17061)
        {
            _19168 = _17249.z;
        }
        else
        {
            _19168 = _9358.z;
        }
        vec4 _16671 = _10098;
        _16671.x = _12918;
        _16671.y = _12919;
        _16671.z = _19168;
        _21381 = _16671;
    }
    else
    {
        _21381 = _10098;
    }
    vec4 _10099 = _21381.xyzw;
    vec4 _21382;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 15)
    {
        vec3 _8732 = _23045.xyz;
        vec3 _17250 = _8732 * vec3(0.077399380505084991455078125);
        vec3 _9359 = pow((_8732 * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        bool _17062 = _15896 <= 0.040449999272823333740234375;
        float _12922;
        if (_17062)
        {
            _12922 = _17250.x;
        }
        else
        {
            _12922 = _9359.x;
        }
        float _12923;
        if (_17062)
        {
            _12923 = _17250.y;
        }
        else
        {
            _12923 = _9359.y;
        }
        float _19169;
        if (_17062)
        {
            _19169 = _17250.z;
        }
        else
        {
            _19169 = _9359.z;
        }
        vec4 _16672 = _10099;
        _16672.x = _12922;
        _16672.y = _12923;
        _16672.z = _19169;
        _21382 = _16672;
    }
    else
    {
        _21382 = _10099;
    }
    vec4 _21383;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 16)
    {
        _21383 = vec4(_Globals_.g_vShaderIDColor.xyz, 1.0);
    }
    else
    {
        _21383 = _21382.xyzw;
    }
    vec4 _21384;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 17)
    {
        _21384 = vec4(_19323, 1.0);
    }
    else
    {
        _21384 = _21383.xyzw;
    }
    vec4 _19632;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 18)
    {
        _19632 = vec4(_20079, _20079, _20079, 1.0);
    }
    else
    {
        _19632 = _21384.xyzw;
    }
    vec4 _24367 = _19632.xyzw;
    vec3 _17692 = _20481.xyz;
    vec4 _21387;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 20)
    {
        _17692.y = -_20481.y;
        vec3 _24093 = (_17692.xyz * 0.5) + vec3(0.5);
        float _9980 = _24093.x;
        vec4 _20496 = _24367;
        _20496.x = _9980;
        float _21831 = _24093.y;
        _20496.y = _21831;
        float _21796 = _24093.z;
        _20496.z = _21796;
        vec3 _12211 = _20496.xyz * vec3(0.077399380505084991455078125);
        vec3 _9360 = pow((_20496.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _23036;
        if (_9980 <= 0.040449999272823333740234375)
        {
            _23036 = _12211.x;
        }
        else
        {
            _23036 = _9360.x;
        }
        float _23037;
        if (_21831 <= 0.040449999272823333740234375)
        {
            _23037 = _12211.y;
        }
        else
        {
            _23037 = _9360.y;
        }
        float _19170;
        if (_21796 <= 0.040449999272823333740234375)
        {
            _19170 = _12211.z;
        }
        else
        {
            _19170 = _9360.z;
        }
        _20496.x = _23036;
        _20496.y = _23037;
        _20496.z = _19170;
        _21387 = _20496;
    }
    else
    {
        _21387 = _24367;
    }
    vec4 _10103 = _21387.xyzw;
    vec4 _21388;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 21)
    {
        vec3 _24094 = (_14786.xyz * 0.5) + vec3(0.5);
        float _9981 = _24094.x;
        vec4 _20497 = _10103;
        _20497.x = _9981;
        float _21832 = _24094.y;
        _20497.y = _21832;
        float _21797 = _24094.z;
        _20497.z = _21797;
        vec3 _12212 = _20497.xyz * vec3(0.077399380505084991455078125);
        vec3 _9361 = pow((_20497.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _23044;
        if (_9981 <= 0.040449999272823333740234375)
        {
            _23044 = _12212.x;
        }
        else
        {
            _23044 = _9361.x;
        }
        float _23046;
        if (_21832 <= 0.040449999272823333740234375)
        {
            _23046 = _12212.y;
        }
        else
        {
            _23046 = _9361.y;
        }
        float _19171;
        if (_21797 <= 0.040449999272823333740234375)
        {
            _19171 = _12212.z;
        }
        else
        {
            _19171 = _9361.z;
        }
        _20497.x = _23044;
        _20497.y = _23046;
        _20497.z = _19171;
        _21388 = _20497;
    }
    else
    {
        _21388 = _10103;
    }
    vec4 _10121 = _21388.xyzw;
    vec4 _21389;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 22)
    {
        vec3 _9252 = (input_6.xyz * 0.5) + vec3(0.5);
        float _9983 = _9252.x;
        vec4 _20498 = _10121;
        _20498.x = _9983;
        float _21833 = _9252.y;
        _20498.y = _21833;
        float _21798 = _9252.z;
        _20498.z = _21798;
        vec3 _12213 = _20498.xyz * vec3(0.077399380505084991455078125);
        vec3 _9362 = pow((_20498.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _23047;
        if (_9983 <= 0.040449999272823333740234375)
        {
            _23047 = _12213.x;
        }
        else
        {
            _23047 = _9362.x;
        }
        float _23051;
        if (_21833 <= 0.040449999272823333740234375)
        {
            _23051 = _12213.y;
        }
        else
        {
            _23051 = _9362.y;
        }
        float _19172;
        if (_21798 <= 0.040449999272823333740234375)
        {
            _19172 = _12213.z;
        }
        else
        {
            _19172 = _9362.z;
        }
        _20498.x = _23047;
        _20498.y = _23051;
        _20498.z = _19172;
        _21389 = _20498;
    }
    else
    {
        _21389 = _10121;
    }
    vec4 _10125 = _21389.xyzw;
    vec4 _21390;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 23)
    {
        vec3 _9253 = (_7425.xyz * 0.5) + vec3(0.5);
        float _9984 = _9253.x;
        vec4 _20500 = _10125;
        _20500.x = _9984;
        float _21834 = _9253.y;
        _20500.y = _21834;
        float _21799 = _9253.z;
        _20500.z = _21799;
        vec3 _12214 = _20500.xyz * vec3(0.077399380505084991455078125);
        vec3 _9366 = pow((_20500.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _23052;
        if (_9984 <= 0.040449999272823333740234375)
        {
            _23052 = _12214.x;
        }
        else
        {
            _23052 = _9366.x;
        }
        float _23053;
        if (_21834 <= 0.040449999272823333740234375)
        {
            _23053 = _12214.y;
        }
        else
        {
            _23053 = _9366.y;
        }
        float _19173;
        if (_21799 <= 0.040449999272823333740234375)
        {
            _19173 = _12214.z;
        }
        else
        {
            _19173 = _9366.z;
        }
        _20500.x = _23052;
        _20500.y = _23053;
        _20500.z = _19173;
        _21390 = _20500;
    }
    else
    {
        _21390 = _10125;
    }
    vec4 _10129 = _21390.xyzw;
    vec4 _21391;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 24)
    {
        vec3 _9254 = (_10560 * 0.5) + vec3(0.5);
        float _9985 = _9254.x;
        vec4 _20501 = _10129;
        _20501.x = _9985;
        float _21835 = _9254.y;
        _20501.y = _21835;
        float _21800 = _9254.z;
        _20501.z = _21800;
        vec3 _12215 = _20501.xyz * vec3(0.077399380505084991455078125);
        vec3 _9367 = pow((_20501.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _23054;
        if (_9985 <= 0.040449999272823333740234375)
        {
            _23054 = _12215.x;
        }
        else
        {
            _23054 = _9367.x;
        }
        float _23055;
        if (_21835 <= 0.040449999272823333740234375)
        {
            _23055 = _12215.y;
        }
        else
        {
            _23055 = _9367.y;
        }
        float _19174;
        if (_21800 <= 0.040449999272823333740234375)
        {
            _19174 = _12215.z;
        }
        else
        {
            _19174 = _9367.z;
        }
        _20501.x = _23054;
        _20501.y = _23055;
        _20501.z = _19174;
        _21391 = _20501;
    }
    else
    {
        _21391 = _10129;
    }
    vec4 _10133 = _21391.xyzw;
    vec4 _21392;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 25)
    {
        vec3 _24095 = (_17115.xyz * 0.5) + vec3(0.5);
        float _9986 = _24095.x;
        vec4 _20502 = _10133;
        _20502.x = _9986;
        float _21836 = _24095.y;
        _20502.y = _21836;
        float _21803 = _24095.z;
        _20502.z = _21803;
        vec3 _12216 = _20502.xyz * vec3(0.077399380505084991455078125);
        vec3 _9368 = pow((_20502.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        float _23056;
        if (_9986 <= 0.040449999272823333740234375)
        {
            _23056 = _12216.x;
        }
        else
        {
            _23056 = _9368.x;
        }
        float _23057;
        if (_21836 <= 0.040449999272823333740234375)
        {
            _23057 = _12216.y;
        }
        else
        {
            _23057 = _9368.y;
        }
        float _19175;
        if (_21803 <= 0.040449999272823333740234375)
        {
            _19175 = _12216.z;
        }
        else
        {
            _19175 = _9368.z;
        }
        _20502.x = _23056;
        _20502.y = _23057;
        _20502.z = _19175;
        _21392 = _20502;
    }
    else
    {
        _21392 = _10133;
    }
    vec4 _10140 = _21392.xyzw;
    vec4 _21393;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 30)
    {
        vec3 _10352 = dFdx(_10560).xyz;
        vec3 _12421 = dFdy(_10560).xyz;
        float _12960 = pow(saturate(max(dot(_10352, _10352), dot(_12421, _12421))), 0.333000004291534423828125);
        vec4 _7560 = _10140;
        _7560.x = _12960;
        _7560.y = _12960;
        _7560.z = _12960;
        _21393 = _7560;
    }
    else
    {
        _21393 = _10140;
    }
    vec4 _10141 = _21393.xyzw;
    vec4 _19365;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 31)
    {
        vec4 _11082 = _10141;
        _11082.x = _10476;
        _11082.y = _10476;
        _11082.z = _10476;
        vec3 _12219 = _11082.xyz * vec3(0.077399380505084991455078125);
        vec3 _9369 = pow((_11082.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
        bool _17073 = _10476 <= 0.040449999272823333740234375;
        float _12924;
        if (_17073)
        {
            _12924 = _12219.x;
        }
        else
        {
            _12924 = _9369.x;
        }
        float _12925;
        if (_17073)
        {
            _12925 = _12219.y;
        }
        else
        {
            _12925 = _9369.y;
        }
        float _19176;
        if (_17073)
        {
            _19176 = _12219.z;
        }
        else
        {
            _19176 = _9369.z;
        }
        _11082.x = _12924;
        _11082.y = _12925;
        _11082.z = _19176;
        _19365 = _11082;
    }
    else
    {
        _19365 = _10141;
    }
    vec4 _24719 = _19365.xyzw;
    vec4 _19366;
    SPIRV_CROSS_FLATTEN
    if (_15571 == 6)
    {
        vec4 _23137 = _24719;
        _23137.x = _20195.x;
        _23137.y = _20195.y;
        _23137.z = _20195.z;
        uvec2 _7122 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tColor], int(0u)));
        uint _10563 = uint(((_23261.x < 0.0) != (_23261.y < 0.0)) ? 0 : 1);
        uvec2 _16394 = uvec2(abs(_23261.xy) * vec2(uvec2(ivec2(int(_7122.x), int(_7122.y))).xy));
        vec4 _10152;
        if (((_16394.x + _16394.y) & 1u) == _10563)
        {
            vec3 _8828 = _23137.xyz * 0.800000011920928955078125;
            vec4 _8678 = _23137;
            _8678.x = _8828.x;
            _8678.y = _8828.y;
            _8678.z = _8828.z;
            _10152 = _8678;
        }
        else
        {
            _10152 = _23137;
        }
        uvec2 _22962 = _16394 / uvec2(16u);
        vec4 _12524;
        if (((_22962.x + _22962.y) & 1u) == _10563)
        {
            vec3 _8829 = _10152.xyz * 0.5;
            vec4 _8679 = _10152;
            _8679.x = _8829.x;
            _8679.y = _8829.y;
            _8679.z = _8829.z;
            _12524 = _8679;
        }
        else
        {
            _12524 = _10152;
        }
        _19366 = _12524;
    }
    else
    {
        _19366 = _24719;
    }
    vec4 _7720 = _19366.xyzw;
    vec4 _7080;
    SPIRV_CROSS_BRANCH
    if (_15571 == 70)
    {
        vec4 _23138 = _7720;
        _23138.x = _20195.x;
        _23138.y = _20195.y;
        _23138.z = _20195.z;
        uvec2 _11146 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tColor], int(0u)));
        int _18862 = int(_11146.x);
        int _18706 = int(_11146.y);
        vec2 _23197 = textureQueryLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tColor], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _23261.xy);
        float _21997 = _23197.x;
        uvec2 _9210 = uvec2(vec2(uvec2(abs(_23261.xy) * vec2(ivec2(_18862, _18706).xy))) / vec2(8.0 * round(1.0 + _21997)));
        float _19406 = saturate(1.0 - (_21997 / log2(float(max(_18862, _18706)))));
        float _17477 = _19406 * _19406;
        float _20305 = _17477 * _19406;
        vec4 _14653 = vec4(1.0, _19406, _17477, _20305);
        vec2 _10663 = vec2(_17477, _20305) * _17477;
        vec3 _22769 = mix(_23138.xyz, vec3(dot(_14653, vec4(0.135721385478973388671875, 4.6153926849365234375, -42.6603240966796875, 132.1310882568359375)) + dot(_10663, vec2(-152.9423980712890625, 59.286380767822265625)), dot(_14653, vec4(0.091402612626552581787109375, 2.1941883563995361328125, 4.842966556549072265625, -14.1850337982177734375)) + dot(_10663, vec2(4.277298450469970703125, 2.82956600189208984375)), dot(_14653, vec4(0.106673300266265869140625, 12.64194583892822265625, -60.5820465087890625, 110.36277008056640625)) + dot(_10663, vec2(-89.903106689453125, 27.3482494354248046875))), vec3((((_9210.x + _9210.y) & 1u) == uint(((_23261.x < 0.0) != (_23261.y < 0.0)) ? 0 : 1)) ? 0.75 : 0.25));
        vec4 _17848 = _23138;
        _17848.x = _22769.x;
        _17848.y = _22769.y;
        _17848.z = _22769.z;
        _7080 = _17848;
    }
    else
    {
        _7080 = _7720;
    }
    vec4 _21716;
    if (_15571 == 65)
    {
        float _13079 = mix(0.5, 1.0, _24878);
        vec4 _18880 = _7080;
        _18880.x = _13079;
        _18880.y = _13079;
        _18880.z = _13079;
        vec3 _16542 = _18880.xyz * mix(vec3(1.0), vec3(1.0, 0.5, 0.5), _9716.xxx);
        vec4 _23717 = _18880;
        _23717.x = _16542.x;
        _23717.y = _16542.y;
        _23717.z = _16542.z;
        vec3 _16543 = _23717.xyz * mix(vec3(1.0), vec3(0.5, 1.0, 0.5), _9716.yyy);
        vec4 _23718 = _23717;
        _23718.x = _16543.x;
        _23718.y = _16543.y;
        _23718.z = _16543.z;
        vec3 _16544 = _23718.xyz * mix(vec3(1.0), vec3(0.5, 0.5, 1.0), _9716.zzz);
        vec4 _23719 = _23718;
        _23719.x = _16544.x;
        _23719.y = _16544.y;
        _23719.z = _16544.z;
        vec3 _16545 = _23719.xyz * mix(vec3(1.0), vec3(1.0, 1.0, 0.5), _9716.www);
        vec4 _23720 = _23719;
        _23720.x = _16545.x;
        _23720.y = _16545.y;
        _23720.z = _16545.z;
        _21716 = _23720;
    }
    else
    {
        vec4 _12525;
        if (_15571 == 66)
        {
            float _17131 = mix(0.25, 1.0, _24878);
            vec4 _18879 = _7080;
            _18879.x = _17131;
            _18879.y = _17131;
            _18879.z = _17131;
            _12525 = _18879;
        }
        else
        {
            _12525 = _7080;
        }
        _21716 = _12525;
    }
    bool _12926;
    if (_Globals_.g_bHighlightDeprecated != 0)
    {
        _12926 = _Globals_.g_bIsDeprecated != 0;
    }
    else
    {
        _12926 = false;
    }
    vec4 _19367;
    if (_12926)
    {
        float _18289 = PerViewConstantBuffer_t._m0 * 0.5;
        vec3 _25191 = mix(_21716.xyz, vec3(1.0, 0.0, 0.0), vec3(abs(((_18289 - 1.0 * trunc(_18289 / 1.0)) * 1.60000002384185791015625) - 0.800000011920928955078125)));
        vec4 _17849 = _21716;
        _17849.x = _25191.x;
        _17849.y = _25191.y;
        _17849.z = _25191.z;
        _19367 = _17849;
    }
    else
    {
        _19367 = _21716;
    }
    vec3 _19342;
    if (_Globals_.g_flSpawnInvulnerability > 0.0)
    {
        float _11148 = 1.0 - saturate(dot(_23409, _12688));
        _19342 = mix(_19367.xyz, _Globals_.g_cInvulnerabilityColor * (mix(dot(_19367.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 0.5, 0.5) + (4.0 * pow(mix(_11148 * texelFetch(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m4], ivec3(ivec2(_11408.xy) & PerViewConstantBufferCsgo_t._m14, 0).xy, 0).y, 1.0, _11148), mix(3.0, 6.0, 1.0 + (sin(PerViewConstantBuffer_t._m1 * 20.0) * 0.5))))), vec3(_Globals_.g_flSpawnInvulnerability));
    }
    else
    {
        _19342 = _19367.xyz;
    }
    vec4 _23946 = _19367;
    _23946.x = _19342.x;
    _23946.y = _19342.y;
    _23946.z = _19342.z;
    SPIRV_CROSS_BRANCH
    if (_Globals_.g_vKeychainGhostHandData.w > 0.0)
    {
        float _11567 = saturate((smoothstep(6.0, 2.0, distance(_Globals_.g_vKeychainGhostHandData.xyz, _11901)) - 1.0) * (-1.0));
        if ((texelFetch(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m4], ivec3(ivec2(_11408.xy) & PerViewConstantBufferCsgo_t._m14, 0).xy, 0).y - mix((_11567 * 0.5099999904632568359375) + 0.5, (_11567 * 0.90999996662139892578125) + 0.100000001490116119384765625, smoothstep(0.100000001490116119384765625, 1.0, _Globals_.g_vKeychainGhostHandData.w))) < 0.0)
        {
            discard;
        }
    }
    if (input_4.w < 1.0)
    {
        if ((fma(input_4.w, 2.0, -1.5) + texelFetch(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m4], ivec3(ivec2(_11408.xy) & PerViewConstantBufferCsgo_t._m14, 0).xy, 0).y) < 0.0)
        {
            discard;
        }
    }
    output_0 = _23946;
}


