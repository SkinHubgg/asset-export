// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 23 (name: g_vAlbedoLevels) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (218144 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup
// Static combos: S_STICKERS

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

struct _630
{
    vec4 _m0[3];
};

struct _249
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

struct _1780
{
    _1753 _m0[128];
};

struct _2067
{
    mat4 _m0[4];
};

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

struct _600
{
    int g_bStickerProjectionPreview;
    int g_bStickerPreviewForceOn;
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
    uint g_sCookieSampler;
    uint g_tShadowDepthBufferCmpSampler;
    int g_bFogEnabled;
    int g_bDontFlipBackfaceNormals;
    int g_bRenderBackfaceNormals;
    uint g_tNormal;
    uint g_tAmbientOcclusion;
    vec2 g_vMetalnessRemapRange;
    float g_flMetalnessTransitionBias;
    float g_flRainExposureToSkyWetness;
    float g_flRainExposureLocalTimer;
    vec3 g_vAlbedoLevels;
    vec3 g_vDarkMetallicAlbedoLevels;
    vec3 g_vMetallicAlbedoLevels;
    float g_fColorBoostFactor;
    vec3 g_vHoloAlbedoLevels;
    uint g_sPoint;
    uint g_sAnisoClampV;
    uint g_tStickerScratches;
    int g_nActiveStickerApplySlot;
    int g_bActiveStickerMoving;
    float g_bActiveStickerPeelStartTime;
    int g_bActiveStickerMouseOver;
    uint g_tStickerWepInputs;
    int g_bEnableSticker0;
    uint g_tSticker0;
    vec2 g_vSticker0Offset;
    vec2 g_vSticker0Scale;
    float g_flSticker0Rotation;
    float g_flSticker0Wear;
    vec2 g_vWearBiasSticker0;
    float g_fWearScratchesSticker0;
    vec3 g_vColorTintSticker0;
    float g_flTintSaturateSticker0;
    int g_bAutomaticPBRColorFittingSticker0;
    int g_bLegacyTintMultiplySticker0;
    float g_flColorBoostSticker0;
    float g_flSfxColorBoostSticker0;
    int g_bMetallicSticker0;
    int g_bHolographicSticker0;
    int g_bPaperBackingSticker0;
    int g_bPreserveRoughnessSticker0;
    int g_bGlitterSticker0;
    uint g_tHoloSpectrumSticker0;
    int g_bClampSpectrumVSticker0;
    float g_flGlitterScaleSticker0;
    int g_bSelfIllumSticker0;
    uint g_tNormalRoughnessSticker0;
    uint g_tGlitterNormalSticker0;
    uint g_tSfxMaskSticker0;
    float g_flHighlightTimeSticker0;
    int g_bEnableSticker1;
    uint g_tSticker1;
    vec2 g_vSticker1Offset;
    vec2 g_vSticker1Scale;
    float g_flSticker1Rotation;
    float g_flSticker1Wear;
    vec2 g_vWearBiasSticker1;
    float g_fWearScratchesSticker1;
    vec3 g_vColorTintSticker1;
    float g_flTintSaturateSticker1;
    int g_bAutomaticPBRColorFittingSticker1;
    int g_bLegacyTintMultiplySticker1;
    float g_flColorBoostSticker1;
    float g_flSfxColorBoostSticker1;
    int g_bMetallicSticker1;
    int g_bHolographicSticker1;
    int g_bPaperBackingSticker1;
    int g_bPreserveRoughnessSticker1;
    int g_bGlitterSticker1;
    uint g_tHoloSpectrumSticker1;
    int g_bClampSpectrumVSticker1;
    float g_flGlitterScaleSticker1;
    int g_bSelfIllumSticker1;
    uint g_tNormalRoughnessSticker1;
    uint g_tGlitterNormalSticker1;
    uint g_tSfxMaskSticker1;
    float g_flHighlightTimeSticker1;
    int g_bEnableSticker2;
    uint g_tSticker2;
    vec2 g_vSticker2Offset;
    vec2 g_vSticker2Scale;
    float g_flSticker2Rotation;
    float g_flSticker2Wear;
    vec2 g_vWearBiasSticker2;
    float g_fWearScratchesSticker2;
    vec3 g_vColorTintSticker2;
    float g_flTintSaturateSticker2;
    int g_bAutomaticPBRColorFittingSticker2;
    int g_bLegacyTintMultiplySticker2;
    float g_flColorBoostSticker2;
    float g_flSfxColorBoostSticker2;
    int g_bMetallicSticker2;
    int g_bHolographicSticker2;
    int g_bPaperBackingSticker2;
    int g_bPreserveRoughnessSticker2;
    int g_bGlitterSticker2;
    uint g_tHoloSpectrumSticker2;
    int g_bClampSpectrumVSticker2;
    float g_flGlitterScaleSticker2;
    int g_bSelfIllumSticker2;
    uint g_tNormalRoughnessSticker2;
    uint g_tGlitterNormalSticker2;
    uint g_tSfxMaskSticker2;
    float g_flHighlightTimeSticker2;
    int g_bEnableSticker3;
    uint g_tSticker3;
    vec2 g_vSticker3Offset;
    vec2 g_vSticker3Scale;
    float g_flSticker3Rotation;
    float g_flSticker3Wear;
    vec2 g_vWearBiasSticker3;
    float g_fWearScratchesSticker3;
    vec3 g_vColorTintSticker3;
    float g_flTintSaturateSticker3;
    int g_bAutomaticPBRColorFittingSticker3;
    int g_bLegacyTintMultiplySticker3;
    float g_flColorBoostSticker3;
    float g_flSfxColorBoostSticker3;
    int g_bMetallicSticker3;
    int g_bHolographicSticker3;
    int g_bPaperBackingSticker3;
    int g_bPreserveRoughnessSticker3;
    int g_bGlitterSticker3;
    uint g_tHoloSpectrumSticker3;
    int g_bClampSpectrumVSticker3;
    float g_flGlitterScaleSticker3;
    int g_bSelfIllumSticker3;
    uint g_tNormalRoughnessSticker3;
    uint g_tGlitterNormalSticker3;
    uint g_tSfxMaskSticker3;
    float g_flHighlightTimeSticker3;
    int g_bEnableSticker4;
    uint g_tSticker4;
    vec2 g_vSticker4Offset;
    vec2 g_vSticker4Scale;
    float g_flSticker4Rotation;
    float g_flSticker4Wear;
    vec2 g_vWearBiasSticker4;
    float g_fWearScratchesSticker4;
    vec3 g_vColorTintSticker4;
    float g_flTintSaturateSticker4;
    int g_bAutomaticPBRColorFittingSticker4;
    int g_bLegacyTintMultiplySticker4;
    float g_flColorBoostSticker4;
    float g_flSfxColorBoostSticker4;
    int g_bMetallicSticker4;
    int g_bHolographicSticker4;
    int g_bPaperBackingSticker4;
    int g_bPreserveRoughnessSticker4;
    int g_bGlitterSticker4;
    uint g_tHoloSpectrumSticker4;
    int g_bClampSpectrumVSticker4;
    float g_flGlitterScaleSticker4;
    int g_bSelfIllumSticker4;
    uint g_tNormalRoughnessSticker4;
    uint g_tGlitterNormalSticker4;
    uint g_tSfxMaskSticker4;
    float g_flHighlightTimeSticker4;
    int bIridescence;
    float g_flIridescentScale;
    float g_flIridescentStrength;
    float g_flIridescentHueShift;
    float g_flSpawnInvulnerability;
    vec3 g_cInvulnerabilityColor;
    vec4 g_vKeychainGhostHandData;
    float g_flPearlescentScale;
};

layout(set = 1) uniform _600 _Globals_;

struct _2595
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
    vec4 _m30;
};

layout(set = 1) uniform _2595 PerViewConstantBufferCsgo_t;

struct _1908
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
    vec3 _m9;
};

layout(set = 1) uniform _1908 PerViewConstantBuffer_t;

struct _1725
{
    vec4 _m0;
    vec4 _m1;
    vec4 _m2;
    vec4 _m3;
    vec4 _m4;
    _630 _m5;
    _249 _m6;
    vec4 _m7;
    vec4 _m8;
    vec4 _m9;
    uvec4 _m10;
    uvec4 _m11;
    uvec4 _m12;
    vec4 _m13;
    vec4 _m14;
    _1780 _m15;
    vec4 _m16;
    vec4 _m17;
    int _m18;
    float _m19;
    vec4 _m20;
    float _m21;
    float _m22;
    float _m23;
    float _m24;
    _2067 _m25;
    _249 _m26;
    uint _m27;
    uint _m28;
};

layout(set = 3) uniform _1725 PerViewLightingConstantBufferGpu_t;

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
layout(set = 4, binding = 46) uniform textureCubeArray g_bindless_TextureCubeArray[65536];
layout(set = 4, binding = 46) uniform texture2DArray g_bindless_Texture2DArray_float4[65536];
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
    vec4 _13444 = input_3;
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
        vec2 _18197 = _13444.xy * 2.5;
        vec2 _20826;
        if ((length(cross(vec3(dFdx(_13444.xy), 0.0), vec3(dFdy(_13444.xy), 0.0))) / max(9.9999997473787516355514526367188e-05, length(cross(dFdx(_10413), dFdy(_10413))))) < 0.00200000009499490261077880859375)
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
        vec2 _13861 = _13444.xy + (((_8562.xy * (-0.0199999995529651641845703125)) * _10538) * _7729);
        vec4 _20488 = _13444;
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
        _23261 = _13444;
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
    vec3 _10251;
    SPIRV_CROSS_BRANCH
    if (_12885)
    {
        _10251 = _21709 * (gl_FrontFacing ? 1.0 : (-1.0));
    }
    else
    {
        _10251 = _21709;
    }
    vec3 _24347 = normalize(_10251);
    vec3 _10061 = input_1 + PerViewConstantBufferCsgo_t._m27.xyz;
    vec4 _19680 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tColor], g_bindless_Sampler[_Globals_.g_sUserConfigAllowGlobalMipBias]), _23261.xy);
    vec3 _21103 = _19680.xyz * input_4.xyz;
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
        _17115 = mix(normalize(mix(_24347, _7054, vec3(1.0 + (_23650 * 1.5)))), normalize((((input_6.xyz * _13998.x).xyz + (_7424.xyz * _13998.y)).xyz + (_24347.xyz * _8927)).xyz), vec3(_18483));
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
    vec3 _21710;
    SPIRV_CROSS_BRANCH
    if (_Globals_.g_flPearlescentScale != 0.0)
    {
        float _21433 = (_Globals_.g_flPearlescentScale * (1.0 - dot(normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz), _7054))) * _24590;
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
        _21710 = mix(vec3(dot(_13137.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), ((_13137.xyz * _15271) + (cross(vec3(0.57735002040863037109375), _13137.xyz) * sin(_21433))) + ((vec3(0.57735002040863037109375) * dot(vec3(0.57735002040863037109375), _13137.xyz)) * (1.0 - _15271)), vec3(pow(_12935, 0.125)));
    }
    else
    {
        _21710 = _13137;
    }
    vec4 _21367 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tStickerWepInputs], g_bindless_Sampler[_Globals_.g_sUserConfig]), _23261.xy);
    float _19148 = _21367.x;
    bool _12887;
    if (_19148 > 0.0)
    {
        _12887 = _23261.z > (-1.0);
    }
    else
    {
        _12887 = false;
    }
    vec4 _13219;
    float _14001;
    vec3 _16353;
    vec2 _17344;
    float _17345;
    vec3 _17346;
    float _17347;
    float _17348;
    vec3 _17349;
    float _17350;
    vec3 _24173;
    if (_12887)
    {
        bool _12888;
        if (_Globals_.g_bEnableSticker0 != 0)
        {
            _12888 = true;
        }
        else
        {
            _12888 = _Globals_.g_bStickerPreviewForceOn != 0;
        }
        vec3 _6619;
        float _13149;
        vec4 _13696;
        vec3 _16314;
        float _17140;
        float _17141;
        vec2 _17142;
        float _17143;
        vec3 _17146;
        vec3 _17147;
        float _17148;
        if (_12888)
        {
            float _10826 = _Globals_.g_flGlitterScaleSticker0 * (notEqual(PerViewConstantBufferCsgo_t._m2, ivec4(0)).x ? 2.5 : 1.75);
            bool _23698 = _Globals_.g_bAutomaticPBRColorFittingSticker0 != 0;
            bool _23699 = _Globals_.g_bLegacyTintMultiplySticker0 != 0;
            bool _23700 = _Globals_.g_bMetallicSticker0 != 0;
            bool _23702 = _Globals_.g_bPaperBackingSticker0 != 0;
            float _13147;
            vec3 _16313;
            vec3 _16483;
            float _17133;
            float _17134;
            vec2 _17135;
            float _17136;
            vec3 _17137;
            vec3 _17138;
            float _17139;
            vec4 _17192;
            do
            {
                bool _17762 = _24464.y;
                float _19502 = _17762 ? 0.0 : input_4.w;
                bool _12889;
                if (_Globals_.g_vSticker0Scale.x == 0.0)
                {
                    _12889 = true;
                }
                else
                {
                    _12889 = _Globals_.g_vSticker0Scale.y == 0.0;
                }
                bool _12890;
                if (_12889)
                {
                    _12890 = true;
                }
                else
                {
                    _12890 = _19148 == 0.0;
                }
                if (_12890)
                {
                    _13147 = _19502;
                    _16313 = vec3(0.0);
                    _17133 = _24590;
                    _17134 = 0.0199999995529651641845703125;
                    _17135 = _16306;
                    _17136 = _20079;
                    _17137 = _6616;
                    _17138 = _21710;
                    _17139 = _17476;
                    _17192 = vec4(0.0);
                    _16483 = vec3(0.0);
                    break;
                }
                bool _10234 = 1 == _Globals_.g_nActiveStickerApplySlot;
                vec2 _17352 = ((_23261.zw - vec2(0.5)) - _Globals_.g_vSticker0Offset) * abs(_Globals_.g_vSticker0Scale).x;
                float _10689 = _Globals_.g_flSticker0Rotation * 6.28318023681640625;
                float _17504 = _17352.x;
                float _13148 = cos(_10689);
                float _22685 = _17352.y;
                float _20196 = sin(_10689);
                vec2 _15799 = vec2((_17504 * _13148) - (_22685 * _20196), (_17504 * _20196) + (_22685 * _13148)) + vec2(0.5);
                float _10367 = _15799.x;
                bool _12891;
                if (saturate(_10367) != _10367)
                {
                    _12891 = true;
                }
                else
                {
                    float _11829 = _15799.y;
                    _12891 = saturate(_11829) != _11829;
                }
                bool _12892;
                if (_10234)
                {
                    _12892 = _Globals_.g_bActiveStickerMoving == 0;
                }
                else
                {
                    _12892 = false;
                }
                float _19305;
                if (_12892)
                {
                    _19305 = PerViewConstantBuffer_t._m0 - _Globals_.g_bActiveStickerPeelStartTime;
                }
                else
                {
                    _19305 = 0.89999997615814208984375;
                }
                bool _23037 = _19305 < 0.89999997615814208984375;
                vec2 _9983 = saturate(_15799);
                vec2 _11087 = _9983.xy;
                vec4 _20322 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), _11087, -1.0);
                float _7426 = _20322.w;
                float _8480 = saturate(_7426 * 12.75) * _19148;
                vec4 _22296 = _20322;
                _22296.w = _8480;
                uvec2 _10918 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tSticker0], 0));
                vec2 _14459 = vec2(1.0 / float(_10918.x), 1.0 / float(_10918.y));
                vec2 _6345 = textureQueryLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), clamp(_11087, _14459, vec2(1.0) - _14459));
                float _13002 = _6345.x;
                float _8795 = 1.0 - saturate(_13002 - 3.0);
                bool _18603 = _8795 > 0.0;
                vec4 _23168;
                if (_18603)
                {
                    float _15250 = dot(cross(PerViewConstantBuffer_t._m9, PerViewConstantBuffer_t._m8), -_7054);
                    float _24057 = dot(PerViewConstantBuffer_t._m8, _7054);
                    vec4 _17335 = _22296;
                    _17335.w = mix(_8480, max(_8480, (saturate(texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(((_9983 - vec2(0.5)) - (vec2((_15250 * _13148) - (_24057 * _20196), (_15250 * _20196) + (_24057 * _13148)) * 0.00999999977648258209228515625)) + vec2(0.5)).xy, 1.0).w * 12.75) * _19148) * 0.699999988079071044921875), _8795);
                    _23168 = _17335;
                }
                else
                {
                    _23168 = _22296;
                }
                float _24305 = _18603 ? _8480 : 1.0;
                bool _22788;
                if (_23168.w <= 0.0)
                {
                    _22788 = !_23037;
                }
                else
                {
                    _22788 = false;
                }
                vec4 _19373 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormalRoughnessSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), _11087, -1.0);
                float _16001 = _19373.x;
                float _19721 = _19373.y;
                float _16784 = (_16001 + _19721) - 1.00392162799835205078125;
                float _11177 = _16001 - _19721;
                vec3 _15728 = normalize(vec3(vec2(_16784, _11177), (1.0 - abs(_16784)) - abs(_11177)));
                _15728.y = -_15728.y;
                float _20013 = max(_13002, 3.0);
                vec4 _11179 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormal], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20013);
                float _15751 = _11179.x;
                float _17298 = _11179.y;
                float _16785 = (_15751 + _17298) - 1.00392162799835205078125;
                float _11178 = _15751 - _17298;
                vec3 _15729 = normalize(vec3(vec2(_16785, _11178), (1.0 - abs(_16785)) - abs(_11178)));
                _15729.y = -_15729.y;
                vec3 _10176 = normalize(_15729 + ((_15728 * _23168.w) * 2.0));
                float _16221 = min(pow(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tAmbientOcclusion], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20013).x, 0.75), (_24305 * 0.5) + 0.5);
                float _13757 = _19373.z;
                float _22924 = float(_23700);
                vec3 _13139;
                vec3 _16343;
                float _16863;
                if (_Globals_.g_bGlitterSticker0 != 0)
                {
                    vec4 _20323 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), _11087, -1.0);
                    float _16037 = 1.0 - _20323.w;
                    vec3 _13138;
                    vec3 _16381;
                    float _16479;
                    if (_16037 != 0.0)
                    {
                        vec3 _7189 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec4 _16749 = vec4(_9983 * _10826, (vec2(0.5) + _9983) * _10826);
                        vec2 _14097 = _16749.xy;
                        vec2 _12043 = dFdx(_14097);
                        vec2 _22140 = dFdy(_14097);
                        vec2 _8337 = max(_12043, _22140);
                        vec4 _19374 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker0], g_bindless_Sampler[_Globals_.g_sPoint]), _16749.xy);
                        float _16002 = _19374.x;
                        float _19722 = _19374.y;
                        float _16786 = (_16002 + _19722) - 1.00392162799835205078125;
                        float _11180 = _16002 - _19722;
                        vec3 _16013 = normalize(vec3(vec2(_16786, _11180), (1.0 - abs(_16786)) - abs(_11180)));
                        vec3 _22292 = _16013 * _16013.z;
                        vec3 _14755 = _24347.xyz;
                        vec3 _9146 = sin(reflect(_7189, normalize((((input_6.xyz * _22292.x).xyz + (_7424.xyz * _22292.y)).xyz + (_14755 * _22292.z)).xyz)) * 12.0);
                        vec3 _7395 = max(vec3(0.0), (_9146 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17144 = ((vec3(pow(dot(saturate(-_9146).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9146).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7395.xyz + pow(_7395.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _15604 = (0.039999999105930328369140625 * _16037) * saturate(1.0 - (min(_8337.x, _8337.y) * 40.0));
                        vec2 _24093 = _10176.xy + (_22292.xy * _15604);
                        vec3 _20489 = _10176;
                        _20489.x = _24093.x;
                        _20489.y = _24093.y;
                        vec4 _11181 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker0], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _16749.zw, 0.0);
                        float _15752 = _11181.x;
                        float _17300 = _11181.y;
                        float _16787 = (_15752 + _17300) - 1.00392162799835205078125;
                        float _11182 = _15752 - _17300;
                        vec3 _16014 = normalize(vec3(vec2(_16787, _11182), (1.0 - abs(_16787)) - abs(_11182)));
                        vec3 _9148 = sin(reflect(_7189, normalize((((input_6.xyz * _16014.x).xyz + (_7424.xyz * _16014.y)).xyz + (_14755 * _16014.z)).xyz)) * 12.0);
                        vec3 _7396 = max(vec3(0.0), (_9148 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17145 = ((vec3(pow(dot(saturate(-_9148).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9148).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7396.xyz + pow(_7396.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _23793 = _11181.w;
                        vec3 _9756;
                        if (_23698)
                        {
                            vec3 _19212 = normalize(max(vec3(0.0003000000142492353916168212890625), _23168.xyz)) * 1.059999942779541015625;
                            vec3 _13607 = _19212.xyz;
                            _9756 = mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13607 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13607))) / vec3(dot(_19212.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19212 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23168.x, max(_23168.y, _23168.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23168.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz;
                        }
                        else
                        {
                            _9756 = _23168.xyz;
                        }
                        vec2 _13862 = _20489.xy + ((_16014.xy * _15604) * _23793);
                        vec3 _20490 = _20489;
                        _20490.x = _13862.x;
                        _20490.y = _13862.y;
                        _13138 = (max(((_17144 * 0.0500000007450580596923828125) + (_17144 * 0.949999988079071044921875)).xyz * _19374.w, ((_17145 * 0.0500000007450580596923828125) + (_17145 * 0.949999988079071044921875)).xyz * _23793) * (_9756 * _Globals_.g_flSfxColorBoostSticker0)).xyz * _16037;
                        _16381 = _20490;
                        _16479 = max(_22924, _16037 * 0.5);
                    }
                    else
                    {
                        _13138 = vec3(0.0);
                        _16381 = _10176;
                        _16479 = _22924;
                    }
                    _13139 = _13138;
                    _16343 = _16381;
                    _16863 = _16479;
                }
                else
                {
                    _13139 = vec3(0.0);
                    _16343 = _10176;
                    _16863 = _22924;
                }
                vec4 _12894;
                if (_23698)
                {
                    vec3 _24156 = vec3(_16863);
                    vec3 _13747 = mix(vec3(1.0), _Globals_.g_vColorTintSticker0.xyz, _24156);
                    float _11982 = mix(0.0, _Globals_.g_flTintSaturateSticker0, _16863);
                    vec4 _12502;
                    if (_23699)
                    {
                        vec3 _22769 = mix(_23168.xyz, vec3(dot(_23168.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_11982));
                        vec4 _17842 = _23168;
                        _17842.x = _22769.x;
                        _17842.y = _22769.y;
                        _17842.z = _22769.z;
                        vec3 _16474 = saturate(_17842.xyz * _13747);
                        float _15334 = _16474.x;
                        vec4 _13514 = _17842;
                        _13514.x = _15334;
                        float _21816 = _16474.y;
                        _13514.y = _21816;
                        float _21777 = _16474.z;
                        _13514.z = _21777;
                        vec3 _24045 = normalize(max(vec3(0.0003000000142492353916168212890625), _13514.xyz)) * 1.059999942779541015625;
                        float _6671 = dot(saturate(_13514.xyz * _Globals_.g_flColorBoostSticker0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12756 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6671))), _24156);
                        float _20081 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16863);
                        vec3 _22777 = _24045.xyz;
                        vec3 _19114 = max((((_22777 * _20081) * 1.73199999332427978515625) / vec3(length(_22777))) / vec3(dot(_24045.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _24045 * mix(_12756.x, _12756.z, saturate(pow(max(_15334, max(_21816, _21777)) * _Globals_.g_flColorBoostSticker0, _12756.y)))).xyz;
                        vec3 _22937 = mix(vec3(_20081), mix(_19114, min(_12756.zzz, _19114 + vec3(_6671)), vec3(max(0.0, _Globals_.g_flColorBoostSticker0 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20081, _6671), 0.5)));
                        vec4 _13889 = _13514;
                        _13889.x = _22937.x;
                        _13889.y = _22937.y;
                        _13889.z = _22937.z;
                        _12502 = _13889;
                    }
                    else
                    {
                        vec3 _18073 = _13747.xyz;
                        vec3 _10732 = normalize(max(vec3(0.0003000000142492353916168212890625), mix(_18073 * _23168.xyz, _18073, vec3(_11982)).xyz)) * 1.059999942779541015625;
                        float _6670 = dot(saturate(_23168.xyz * _Globals_.g_flColorBoostSticker0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12755 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6670))), _24156);
                        float _20080 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16863);
                        vec3 _22776 = _10732.xyz;
                        vec3 _19113 = max((((_22776 * _20080) * 1.73199999332427978515625) / vec3(length(_22776))) / vec3(dot(_10732.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _10732 * mix(_12755.x, _12755.z, saturate(pow(max(_23168.x, max(_23168.y, _23168.z)) * _Globals_.g_flColorBoostSticker0, _12755.y)))).xyz;
                        vec3 _22936 = mix(vec3(_20080), mix(_19113, min(_12755.zzz, _19113 + vec3(_6670)), vec3(max(0.0, _Globals_.g_flColorBoostSticker0 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20080, _6670), 0.5)));
                        vec4 _13888 = _23168;
                        _13888.x = _22936.x;
                        _13888.y = _22936.y;
                        _13888.z = _22936.z;
                        _12502 = _13888;
                    }
                    _12894 = _12502;
                }
                else
                {
                    vec4 _12501;
                    if (_23700)
                    {
                        vec3 _20059 = mix(_23168.xyz, vec3(dot(_23168.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_Globals_.g_flTintSaturateSticker0)) * _Globals_.g_vColorTintSticker0.xyz;
                        vec4 _23714 = _23168;
                        _23714.x = _20059.x;
                        _23714.y = _20059.y;
                        _23714.z = _20059.z;
                        vec3 _24687 = _23714.xyz * (_23699 ? _Globals_.g_flColorBoostSticker0 : 1.0);
                        vec4 _8673 = _23714;
                        _8673.x = _24687.x;
                        _8673.y = _24687.y;
                        _8673.z = _24687.z;
                        _12501 = _8673;
                    }
                    else
                    {
                        _12501 = _23168;
                    }
                    _12894 = _12501;
                }
                vec3 _12895;
                if (_Globals_.g_bSelfIllumSticker0 != 0)
                {
                    _12895 = (_12894.xyz * _19373.w) * 2.0;
                }
                else
                {
                    _12895 = vec3(0.0);
                }
                vec4 _7479;
                float _12015;
                if (_Globals_.g_bHolographicSticker0 != 0)
                {
                    vec4 _19338 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker0], g_bindless_Sampler[_Globals_.g_sPoint]), _11087, -1.0);
                    vec4 _19718 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), _11087, -1.0);
                    vec3 _20694 = vec3(_19338.w);
                    vec3 _7714 = mix(_19338.xyz, _19718.xyz, _20694);
                    float _20576 = _7714.x;
                    float _13212;
                    vec4 _15670;
                    if (_20576 > 0.0)
                    {
                        vec3 _24006 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec2 _20626 = vec2(_7714.y + (dot(_24006, _24347) + dot(_24006, PerViewLightingConstantBufferGpu_t._m16.xyz)), _7714.z);
                        vec3 _23509;
                        SPIRV_CROSS_BRANCH
                        if (_Globals_.g_bClampSpectrumVSticker0 != 0)
                        {
                            _23509 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker0], g_bindless_Sampler[_Globals_.g_sAnisoClampV]), _20626, -1.0).xyz;
                        }
                        else
                        {
                            _23509 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), _20626, -1.0).xyz;
                        }
                        vec3 _25247 = mix(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker0], g_bindless_Sampler[_Globals_.g_sPoint]), _20626, 0.0).xyz, _23509, _20694);
                        vec3 _19477 = _25247.xyz;
                        float _7244 = dot(saturate(_19477 * _Globals_.g_flSfxColorBoostSticker0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _19213 = normalize(max(vec3(0.0003000000142492353916168212890625), _19477)) * 1.059999942779541015625;
                        vec3 _13608 = _19213.xyz;
                        vec3 _19115 = max((((_13608 * _Globals_.g_vHoloAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13608))) / vec3(dot(_19213.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19213 * mix(_Globals_.g_vHoloAlbedoLevels.x, _Globals_.g_vHoloAlbedoLevels.z, saturate(pow(max(_25247.x, max(_25247.y, _25247.z)) * _Globals_.g_flSfxColorBoostSticker0, _Globals_.g_vHoloAlbedoLevels.y)))).xyz;
                        vec3 _25191 = mix(_12894.xyz, mix(vec3(_Globals_.g_vHoloAlbedoLevels.x), mix(_19115, min(_Globals_.g_vHoloAlbedoLevels.zzz, _19115 + (vec3(_7244) * _Globals_.g_flSfxColorBoostSticker0)), vec3(max(0.0, _Globals_.g_flSfxColorBoostSticker0 - 1.0) / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vHoloAlbedoLevels.x, _7244), 0.5))), vec3(_20576));
                        vec4 _17843 = _12894;
                        _17843.x = _25191.x;
                        _17843.y = _25191.y;
                        _17843.z = _25191.z;
                        _13212 = _16863 * (1.0 - _20576);
                        _15670 = _17843;
                    }
                    else
                    {
                        _13212 = _16863;
                        _15670 = _12894;
                    }
                    _12015 = _13212;
                    _7479 = _15670;
                }
                else
                {
                    _12015 = _16863;
                    _7479 = _12894;
                }
                float _13140;
                float _14139;
                vec4 _14611;
                if (_Globals_.g_flSticker0Wear > 0.0)
                {
                    vec4 _18101 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tStickerScratches], g_bindless_Sampler[_Globals_.g_sAniso]), _11087, -1.0);
                    float _12594 = 1.0 - min(_Globals_.g_fWearScratchesSticker0, _18101.x);
                    float _12766 = mix(_12594, _12594 * 0.5, _Globals_.g_flSticker0Wear);
                    float _16206 = saturate(mix(_Globals_.g_flSticker0Wear, _Globals_.g_flSticker0Wear + ((2.0 * (_21367.y - 0.5)) * smoothstep(1.0, 0.85000002384185791015625, _Globals_.g_flSticker0Wear)), _Globals_.g_flSticker0Wear));
                    float _20309;
                    if (!_23702)
                    {
                        _20309 = ((_Globals_.g_vWearBiasSticker0.y * ((_Globals_.g_vWearBiasSticker0.y > 0.0) ? 0.5 : 0.25)) + 0.5) * 0.5;
                    }
                    else
                    {
                        _20309 = 0.5;
                    }
                    float _8281 = saturate(_16206 - pow(saturate((_7426 - 0.078431375324726104736328125) * 1.085106372833251953125), _Globals_.g_vWearBiasSticker0.x * _Globals_.g_vWearBiasSticker0.x));
                    vec4 _12005;
                    if (_23702)
                    {
                        float _12205 = saturate(_8281 * 2.0) + (_Globals_.g_vWearBiasSticker0.y * _16206);
                        vec3 _25192 = mix(vec3(mix(0.699999988079071044921875, 0.20000000298023223876953125 + (0.4000000059604644775390625 * _12766), _16206)), _7479.xyz, vec3(smoothstep(_12205, _12205 + 0.100000001490116119384765625, _12766)));
                        vec4 _17844 = _7479;
                        _17844.x = _25192.x;
                        _17844.y = _25192.y;
                        _17844.z = _25192.z;
                        _12005 = _17844;
                    }
                    else
                    {
                        _12005 = _7479;
                    }
                    float _18653 = saturate((_8281 * (1.0 + _20309)) - _20309);
                    float _12503;
                    if (_23700 ? true : (_Globals_.g_bPreserveRoughnessSticker0 != 0))
                    {
                        _12503 = _13757;
                    }
                    else
                    {
                        _12503 = mix(_13757, 0.800000011920928955078125, step(_12766, smoothstep(0.0, 0.3499999940395355224609375, _16206)));
                    }
                    _13140 = _16206;
                    _14139 = _12503;
                    _14611 = vec4(mix(_12005.xyz, _12005.xyz * _12766, vec3(_16206 * 0.300000011920928955078125)), _12005.w * smoothstep(_18653, _18653 + 0.100000001490116119384765625, _12766));
                }
                else
                {
                    _13140 = _Globals_.g_flSticker0Wear;
                    _14139 = _13757;
                    _14611 = _7479;
                }
                vec2 _7733 = mix(_11087 - vec2(0.5), _16343.xy, vec2(_14611.w));
                vec3 _17845 = _16343;
                _17845.x = _7733.x;
                _17845.y = _7733.y;
                vec4 _6618;
                float _13144;
                float _13695;
                float _16310;
                float _17120;
                vec3 _17121;
                if (_23037)
                {
                    float _10421 = saturate(_19305 * 1.111111164093017578125);
                    float _23768 = saturate(_19305 * 2.22222232818603515625);
                    float _9521 = pow(_23768, 0.5);
                    float _25021 = _9983.y;
                    float _10074 = _9521 - _25021;
                    float _6968 = abs(_10074);
                    float _13143;
                    float _16309;
                    vec4 _16481;
                    float _17118;
                    vec3 _17119;
                    float _17190;
                    if (_25021 > _9521)
                    {
                        _13143 = _16221;
                        _16309 = _14139;
                        _17118 = _12015;
                        _17119 = _17845;
                        _17190 = _24305;
                        _16481 = vec4(0.0, 0.0, 0.0, _14611.w * (1.0 - pow(_6968, 0.20000000298023223876953125)));
                    }
                    else
                    {
                        float _9895 = mix(1.0, (_10074 + _9521) + (_6968 * 0.300000011920928955078125), pow(_25021, 0.20000000298023223876953125));
                        vec2 _16973 = _9983;
                        _16973.y = _9895;
                        vec4 _10451;
                        float _12735;
                        float _13141;
                        float _16308;
                        float _17116;
                        vec3 _17117;
                        if (_9895 < 1.0)
                        {
                            vec4 _20991 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker0], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(_16973).xy, -1.0);
                            float _12475 = dot(_20991.xyz, vec3(0.2989999949932098388671875, 0.58700001239776611328125, 0.114000000059604644775390625));
                            vec4 _19620;
                            _19620.x = _12475;
                            _19620.y = _12475;
                            _19620.z = _12475;
                            float _16956 = saturate(_20991.w * 12.75);
                            float _18225 = mix(pow(_6968, 0.100000001490116119384765625), 1.0, _23768);
                            vec3 _10962 = vec3(_16956);
                            _13141 = mix(_16221, _18225, _16956);
                            _16308 = mix(_14139, 0.800000011920928955078125, _16956);
                            _17116 = mix(_12015, 0.0, _16956);
                            _17117 = mix(_17845, vec3(0.0, 0.0, 1.0), _10962);
                            _12735 = mix(_24305, 1.0, _16956);
                            _10451 = vec4(mix(_14611.xyz * _18225, vec4(mix(_19620.xyz, vec3(0.300000011920928955078125), vec3(0.800000011920928955078125)) * pow(_6968, 0.20000000298023223876953125), _16956).xyz, _10962), max(_14611.w, _16956));
                        }
                        else
                        {
                            _13141 = _16221;
                            _16308 = _14139;
                            _17116 = _12015;
                            _17117 = _17845;
                            _12735 = _24305;
                            _10451 = _14611;
                        }
                        vec3 _14959 = mix(_10451.xyz, _10451.xyz * 10.0, vec3(step(0.5, _10421) * pow(smoothstep(1.0, 0.5, _10421), 20.0)));
                        vec4 _17846 = _10451;
                        _17846.x = _14959.x;
                        _17846.y = _14959.y;
                        _17846.z = _14959.z;
                        _13143 = _13141;
                        _16309 = _16308;
                        _17118 = _17116;
                        _17119 = _17117;
                        _17190 = _12735;
                        _16481 = _17846;
                    }
                    _13144 = _13143;
                    _16310 = _16309;
                    _17120 = _17118;
                    _17121 = _17119;
                    _13695 = _17190;
                    _6618 = _16481;
                }
                else
                {
                    _13144 = _16221;
                    _16310 = _14139;
                    _17120 = _12015;
                    _17121 = _17845;
                    _13695 = _24305;
                    _6618 = _14611;
                }
                float _10158 = PerViewConstantBuffer_t._m0 - _Globals_.g_flHighlightTimeSticker0;
                vec4 _20310;
                if (_10158 < 2.0)
                {
                    vec3 _22956 = mix(_6618.xyz, _6618.xyz + vec3(1.0), vec3(pow(1.0 - (_10158 * 0.5), 5.0)));
                    vec4 _17847 = _6618;
                    _17847.x = _22956.x;
                    _17847.y = _22956.y;
                    _17847.z = _22956.z;
                    _20310 = _17847;
                }
                else
                {
                    _20310 = _6618;
                }
                float _12751 = _13695 * _20310.w;
                vec4 _11402;
                vec3 _13145;
                float _15651;
                float _16311;
                float _17124;
                vec3 _17125;
                if (_10234)
                {
                    vec4 _21711;
                    if (_Globals_.g_bActiveStickerMouseOver != 0)
                    {
                        vec3 _8828 = _20310.xyz * 2.0;
                        vec4 _8674 = _20310;
                        _8674.x = _8828.x;
                        _8674.y = _8828.y;
                        _8674.z = _8828.z;
                        _21711 = _8674;
                    }
                    else
                    {
                        _21711 = _20310;
                    }
                    bool _14877 = _Globals_.g_bActiveStickerMoving != 0;
                    float _10002;
                    vec4 _24335;
                    if (_14877)
                    {
                        vec2 _10159 = _11087 * 8.0;
                        vec3 _20326 = vec3(0.20000000298023223876953125) + saturate(vec3(dot(_21711.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) * 0.60000002384185791015625);
                        vec4 _20491 = _21711;
                        _20491.x = _20326.x;
                        _20491.y = _20326.y;
                        _20491.z = _20326.z;
                        vec3 _20312 = _20491.xyz + vec3(fract((floor(_10159.x) + floor(_10159.y)) * 0.5) * 0.20020000636577606201171875);
                        vec4 _20493 = _20491;
                        _20493.x = _20312.x;
                        _20493.y = _20312.y;
                        _20493.z = _20312.z;
                        vec3 _22862 = _20493.xyz * _17476;
                        vec4 _8675 = _20493;
                        _8675.x = _22862.x;
                        _8675.y = _22862.y;
                        _8675.z = _22862.z;
                        _10002 = _12751 * 0.89999997615814208984375;
                        _24335 = _8675;
                    }
                    else
                    {
                        _10002 = _12751;
                        _24335 = _21711;
                    }
                    bvec3 _14008 = bvec3(_14877);
                    _13145 = mix(_13139, vec3(0.0), _14008);
                    _16311 = _14877 ? 0.800000011920928955078125 : _16310;
                    _17124 = _14877 ? 0.0 : _17120;
                    _17125 = mix(_17121, vec3(0.0, 0.0, 1.0), _14008);
                    _15651 = _10002;
                    _11402 = _24335;
                }
                else
                {
                    _13145 = _13139;
                    _16311 = _16310;
                    _17124 = _17120;
                    _17125 = _17121;
                    _15651 = _12751;
                    _11402 = _20310;
                }
                float _13146;
                vec3 _16312;
                vec3 _16482;
                float _17126;
                float _17127;
                vec2 _17128;
                float _17129;
                vec3 _17130;
                vec3 _17131;
                float _17132;
                vec4 _17191;
                if (!(_22788 ? true : _12891))
                {
                    vec3 _23345 = vec3(_15651);
                    vec4 _13167;
                    _13167.x = max(0.0, _15651);
                    _13167.w = max(0.0, _15651 * (1.0 - _13140));
                    _13146 = _17762 ? _15651 : _19502;
                    _16312 = mix(vec3(0.0), _12895, _23345);
                    _17126 = mix(_24590, 0.0, _15651);
                    _17127 = mix(0.0199999995529651641845703125, 0.039999999105930328369140625, _15651);
                    _17128 = mix(_16306.xy, vec2(_16311), vec2(_15651));
                    _17129 = mix(_20079, _17124, _15651);
                    _17130 = normalize(mix(_6616.xyz, _17125, _23345));
                    _17131 = mix(_21710.xyz, saturate(_11402.xyz), _23345);
                    _17132 = mix(_17476, _13144, _11402.w);
                    _17191 = _13167;
                    _16482 = mix(vec3(0.0), _13145, _23345);
                }
                else
                {
                    _13146 = _19502;
                    _16312 = vec3(0.0);
                    _17126 = _24590;
                    _17127 = 0.0199999995529651641845703125;
                    _17128 = _16306;
                    _17129 = _20079;
                    _17130 = _6616;
                    _17131 = _21710;
                    _17132 = _17476;
                    _17191 = vec4(0.0);
                    _16482 = vec3(0.0);
                }
                _13147 = _13146;
                _16313 = _16312;
                _17133 = _17126;
                _17134 = _17127;
                _17135 = _17128;
                _17136 = _17129;
                _17137 = _17130;
                _17138 = _17131;
                _17139 = _17132;
                _17192 = _17191;
                _16483 = _16482;
                break;
            } while(false);
            _13149 = _13147;
            _16314 = _16313;
            _17140 = _17133;
            _17141 = _17134;
            _17142 = _17135;
            _17143 = _17136;
            _17146 = _17137;
            _17147 = _17138;
            _17148 = _17139;
            _13696 = _17192;
            _6619 = _16483;
        }
        else
        {
            _13149 = input_4.w;
            _16314 = vec3(0.0);
            _17140 = _24590;
            _17141 = 0.0199999995529651641845703125;
            _17142 = _16306;
            _17143 = _20079;
            _17146 = _6616;
            _17147 = _21710;
            _17148 = _17476;
            _13696 = vec4(0.0);
            _6619 = vec3(0.0);
        }
        bool _12896;
        if (_Globals_.g_bEnableSticker1 != 0)
        {
            _12896 = true;
        }
        else
        {
            _12896 = _Globals_.g_bStickerPreviewForceOn != 0;
        }
        vec3 _6622;
        float _13161;
        vec4 _13698;
        vec3 _16321;
        float _17176;
        float _17177;
        vec2 _17178;
        float _17179;
        vec3 _17180;
        vec3 _17181;
        float _17182;
        if (_12896)
        {
            float _10827 = _Globals_.g_flGlitterScaleSticker1 * (notEqual(PerViewConstantBufferCsgo_t._m2, ivec4(0)).x ? 2.5 : 1.75);
            bool _23707 = _Globals_.g_bAutomaticPBRColorFittingSticker1 != 0;
            bool _23708 = _Globals_.g_bLegacyTintMultiplySticker1 != 0;
            bool _23709 = _Globals_.g_bMetallicSticker1 != 0;
            bool _23711 = _Globals_.g_bPaperBackingSticker1 != 0;
            float _13160;
            vec3 _16320;
            vec3 _16493;
            float _17169;
            float _17170;
            vec2 _17171;
            float _17172;
            vec3 _17173;
            vec3 _17174;
            float _17175;
            vec4 _17195;
            do
            {
                bool _17763 = _24464.y;
                float _19503 = _17763 ? 0.0 : _13149;
                bool _12897;
                if (_Globals_.g_vSticker1Scale.x == 0.0)
                {
                    _12897 = true;
                }
                else
                {
                    _12897 = _Globals_.g_vSticker1Scale.y == 0.0;
                }
                bool _12898;
                if (_12897)
                {
                    _12898 = true;
                }
                else
                {
                    _12898 = _19148 == 0.0;
                }
                if (_12898)
                {
                    _13160 = _19503;
                    _16320 = _16314;
                    _17169 = _17140;
                    _17170 = _17141;
                    _17171 = _17142;
                    _17172 = _17143;
                    _17173 = _17146;
                    _17174 = _17147;
                    _17175 = _17148;
                    _17195 = _13696;
                    _16493 = _6619;
                    break;
                }
                bool _10235 = 2 == _Globals_.g_nActiveStickerApplySlot;
                vec2 _17353 = ((_23261.zw - vec2(0.5)) - _Globals_.g_vSticker1Offset) * abs(_Globals_.g_vSticker1Scale).x;
                float _10690 = _Globals_.g_flSticker1Rotation * 6.28318023681640625;
                float _17505 = _17353.x;
                float _13150 = cos(_10690);
                float _22687 = _17353.y;
                float _20197 = sin(_10690);
                vec2 _15800 = vec2((_17505 * _13150) - (_22687 * _20197), (_17505 * _20197) + (_22687 * _13150)) + vec2(0.5);
                float _10368 = _15800.x;
                bool _12899;
                if (saturate(_10368) != _10368)
                {
                    _12899 = true;
                }
                else
                {
                    float _11830 = _15800.y;
                    _12899 = saturate(_11830) != _11830;
                }
                bool _12900;
                if (_10235)
                {
                    _12900 = _Globals_.g_bActiveStickerMoving == 0;
                }
                else
                {
                    _12900 = false;
                }
                float _19306;
                if (_12900)
                {
                    _19306 = PerViewConstantBuffer_t._m0 - _Globals_.g_bActiveStickerPeelStartTime;
                }
                else
                {
                    _19306 = 0.89999997615814208984375;
                }
                bool _23038 = _19306 < 0.89999997615814208984375;
                vec2 _9984 = saturate(_15800);
                vec2 _11090 = _9984.xy;
                vec4 _20324 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), _11090, -1.0);
                float _7427 = _20324.w;
                float _8481 = saturate(_7427 * 12.75) * _19148;
                vec4 _22297 = _20324;
                _22297.w = _8481;
                uvec2 _10919 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tSticker1], 0));
                vec2 _14460 = vec2(1.0 / float(_10919.x), 1.0 / float(_10919.y));
                vec2 _6346 = textureQueryLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), clamp(_11090, _14460, vec2(1.0) - _14460));
                float _13003 = _6346.x;
                float _8796 = 1.0 - saturate(_13003 - 3.0);
                bool _18604 = _8796 > 0.0;
                vec4 _23169;
                if (_18604)
                {
                    float _15251 = dot(cross(PerViewConstantBuffer_t._m9, PerViewConstantBuffer_t._m8), -_7054);
                    float _24058 = dot(PerViewConstantBuffer_t._m8, _7054);
                    vec4 _17336 = _22297;
                    _17336.w = mix(_8481, max(_8481, (saturate(texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(((_9984 - vec2(0.5)) - (vec2((_15251 * _13150) - (_24058 * _20197), (_15251 * _20197) + (_24058 * _13150)) * 0.00999999977648258209228515625)) + vec2(0.5)).xy, 1.0).w * 12.75) * _19148) * 0.699999988079071044921875), _8796);
                    _23169 = _17336;
                }
                else
                {
                    _23169 = _22297;
                }
                float _24306 = _18604 ? _8481 : 1.0;
                bool _22789;
                if (_23169.w <= 0.0)
                {
                    _22789 = !_23038;
                }
                else
                {
                    _22789 = false;
                }
                vec4 _19375 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormalRoughnessSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), _11090, -1.0);
                float _16003 = _19375.x;
                float _19723 = _19375.y;
                float _16788 = (_16003 + _19723) - 1.00392162799835205078125;
                float _11183 = _16003 - _19723;
                vec3 _15730 = normalize(vec3(vec2(_16788, _11183), (1.0 - abs(_16788)) - abs(_11183)));
                _15730.y = -_15730.y;
                float _20014 = max(_13003, 3.0);
                vec4 _11184 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormal], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20014);
                float _15753 = _11184.x;
                float _17302 = _11184.y;
                float _16789 = (_15753 + _17302) - 1.00392162799835205078125;
                float _11185 = _15753 - _17302;
                vec3 _15731 = normalize(vec3(vec2(_16789, _11185), (1.0 - abs(_16789)) - abs(_11185)));
                _15731.y = -_15731.y;
                vec3 _10177 = normalize(_15731 + ((_15730 * _23169.w) * 2.0));
                float _16222 = min(pow(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tAmbientOcclusion], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20014).x, 0.75), (_24306 * 0.5) + 0.5);
                float _10565 = _19375.z;
                float _13789 = float(_23709);
                vec3 _13152;
                vec3 _16344;
                float _16864;
                if (_Globals_.g_bGlitterSticker1 != 0)
                {
                    vec4 _20325 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), _11090, -1.0);
                    float _16038 = 1.0 - _20325.w;
                    vec3 _13151;
                    vec3 _16382;
                    float _16485;
                    if (_16038 != 0.0)
                    {
                        vec3 _7190 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec4 _16750 = vec4(_9984 * _10827, (vec2(0.5) + _9984) * _10827);
                        vec2 _14098 = _16750.xy;
                        vec2 _12044 = dFdx(_14098);
                        vec2 _22142 = dFdy(_14098);
                        vec2 _8338 = max(_12044, _22142);
                        vec4 _19376 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker1], g_bindless_Sampler[_Globals_.g_sPoint]), _16750.xy);
                        float _16004 = _19376.x;
                        float _19724 = _19376.y;
                        float _16791 = (_16004 + _19724) - 1.00392162799835205078125;
                        float _11186 = _16004 - _19724;
                        vec3 _16015 = normalize(vec3(vec2(_16791, _11186), (1.0 - abs(_16791)) - abs(_11186)));
                        vec3 _22293 = _16015 * _16015.z;
                        vec3 _14756 = _24347.xyz;
                        vec3 _9149 = sin(reflect(_7190, normalize((((input_6.xyz * _22293.x).xyz + (_7424.xyz * _22293.y)).xyz + (_14756 * _22293.z)).xyz)) * 12.0);
                        vec3 _7397 = max(vec3(0.0), (_9149 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17149 = ((vec3(pow(dot(saturate(-_9149).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9149).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7397.xyz + pow(_7397.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _15605 = (0.039999999105930328369140625 * _16038) * saturate(1.0 - (min(_8338.x, _8338.y) * 40.0));
                        vec2 _24094 = _10177.xy + (_22293.xy * _15605);
                        vec3 _20495 = _10177;
                        _20495.x = _24094.x;
                        _20495.y = _24094.y;
                        vec4 _11187 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker1], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _16750.zw, 0.0);
                        float _15754 = _11187.x;
                        float _17304 = _11187.y;
                        float _16792 = (_15754 + _17304) - 1.00392162799835205078125;
                        float _11188 = _15754 - _17304;
                        vec3 _16016 = normalize(vec3(vec2(_16792, _11188), (1.0 - abs(_16792)) - abs(_11188)));
                        vec3 _9150 = sin(reflect(_7190, normalize((((input_6.xyz * _16016.x).xyz + (_7424.xyz * _16016.y)).xyz + (_14756 * _16016.z)).xyz)) * 12.0);
                        vec3 _7398 = max(vec3(0.0), (_9150 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17150 = ((vec3(pow(dot(saturate(-_9150).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9150).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7398.xyz + pow(_7398.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _23794 = _11187.w;
                        vec3 _9757;
                        if (_23707)
                        {
                            vec3 _19214 = normalize(max(vec3(0.0003000000142492353916168212890625), _23169.xyz)) * 1.059999942779541015625;
                            vec3 _13609 = _19214.xyz;
                            _9757 = mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13609 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13609))) / vec3(dot(_19214.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19214 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23169.x, max(_23169.y, _23169.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23169.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz;
                        }
                        else
                        {
                            _9757 = _23169.xyz;
                        }
                        vec2 _13864 = _20495.xy + ((_16016.xy * _15605) * _23794);
                        vec3 _20496 = _20495;
                        _20496.x = _13864.x;
                        _20496.y = _13864.y;
                        _13151 = (max(((_17149 * 0.0500000007450580596923828125) + (_17149 * 0.949999988079071044921875)).xyz * _19376.w, ((_17150 * 0.0500000007450580596923828125) + (_17150 * 0.949999988079071044921875)).xyz * _23794) * (_9757 * _Globals_.g_flSfxColorBoostSticker1)).xyz * _16038;
                        _16382 = _20496;
                        _16485 = max(_13789, _16038 * 0.5);
                    }
                    else
                    {
                        _13151 = _6619.xyz;
                        _16382 = _10177;
                        _16485 = _13789;
                    }
                    _13152 = _13151;
                    _16344 = _16382;
                    _16864 = _16485;
                }
                else
                {
                    _13152 = _6619.xyz;
                    _16344 = _10177;
                    _16864 = _13789;
                }
                vec4 _12902;
                if (_23707)
                {
                    vec3 _24157 = vec3(_16864);
                    vec3 _13748 = mix(vec3(1.0), _Globals_.g_vColorTintSticker1.xyz, _24157);
                    float _11983 = mix(0.0, _Globals_.g_flTintSaturateSticker1, _16864);
                    vec4 _12506;
                    if (_23708)
                    {
                        vec3 _22770 = mix(_23169.xyz, vec3(dot(_23169.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_11983));
                        vec4 _17848 = _23169;
                        _17848.x = _22770.x;
                        _17848.y = _22770.y;
                        _17848.z = _22770.z;
                        vec3 _16475 = saturate(_17848.xyz * _13748);
                        float _15335 = _16475.x;
                        vec4 _13515 = _17848;
                        _13515.x = _15335;
                        float _21828 = _16475.y;
                        _13515.y = _21828;
                        float _21783 = _16475.z;
                        _13515.z = _21783;
                        vec3 _24046 = normalize(max(vec3(0.0003000000142492353916168212890625), _13515.xyz)) * 1.059999942779541015625;
                        float _6673 = dot(saturate(_13515.xyz * _Globals_.g_flColorBoostSticker1).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12760 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6673))), _24157);
                        float _20083 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16864);
                        vec3 _22779 = _24046.xyz;
                        vec3 _19117 = max((((_22779 * _20083) * 1.73199999332427978515625) / vec3(length(_22779))) / vec3(dot(_24046.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _24046 * mix(_12760.x, _12760.z, saturate(pow(max(_15335, max(_21828, _21783)) * _Globals_.g_flColorBoostSticker1, _12760.y)))).xyz;
                        vec3 _22939 = mix(vec3(_20083), mix(_19117, min(_12760.zzz, _19117 + vec3(_6673)), vec3(max(0.0, _Globals_.g_flColorBoostSticker1 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20083, _6673), 0.5)));
                        vec4 _13891 = _13515;
                        _13891.x = _22939.x;
                        _13891.y = _22939.y;
                        _13891.z = _22939.z;
                        _12506 = _13891;
                    }
                    else
                    {
                        vec3 _18074 = _13748.xyz;
                        vec3 _10733 = normalize(max(vec3(0.0003000000142492353916168212890625), mix(_18074 * _23169.xyz, _18074, vec3(_11983)).xyz)) * 1.059999942779541015625;
                        float _6672 = dot(saturate(_23169.xyz * _Globals_.g_flColorBoostSticker1).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12757 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6672))), _24157);
                        float _20082 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16864);
                        vec3 _22778 = _10733.xyz;
                        vec3 _19116 = max((((_22778 * _20082) * 1.73199999332427978515625) / vec3(length(_22778))) / vec3(dot(_10733.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _10733 * mix(_12757.x, _12757.z, saturate(pow(max(_23169.x, max(_23169.y, _23169.z)) * _Globals_.g_flColorBoostSticker1, _12757.y)))).xyz;
                        vec3 _22938 = mix(vec3(_20082), mix(_19116, min(_12757.zzz, _19116 + vec3(_6672)), vec3(max(0.0, _Globals_.g_flColorBoostSticker1 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20082, _6672), 0.5)));
                        vec4 _13890 = _23169;
                        _13890.x = _22938.x;
                        _13890.y = _22938.y;
                        _13890.z = _22938.z;
                        _12506 = _13890;
                    }
                    _12902 = _12506;
                }
                else
                {
                    vec4 _12505;
                    if (_23709)
                    {
                        vec3 _20060 = mix(_23169.xyz, vec3(dot(_23169.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_Globals_.g_flTintSaturateSticker1)) * _Globals_.g_vColorTintSticker1.xyz;
                        vec4 _23718 = _23169;
                        _23718.x = _20060.x;
                        _23718.y = _20060.y;
                        _23718.z = _20060.z;
                        vec3 _24688 = _23718.xyz * (_23708 ? _Globals_.g_flColorBoostSticker1 : 1.0);
                        vec4 _8676 = _23718;
                        _8676.x = _24688.x;
                        _8676.y = _24688.y;
                        _8676.z = _24688.z;
                        _12505 = _8676;
                    }
                    else
                    {
                        _12505 = _23169;
                    }
                    _12902 = _12505;
                }
                vec3 _12903;
                if (_Globals_.g_bSelfIllumSticker1 != 0)
                {
                    _12903 = (_12902.xyz * _19375.w) * 2.0;
                }
                else
                {
                    _12903 = vec3(0.0);
                }
                vec4 _7480;
                float _12021;
                if (_Globals_.g_bHolographicSticker1 != 0)
                {
                    vec4 _19339 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker1], g_bindless_Sampler[_Globals_.g_sPoint]), _11090, -1.0);
                    vec4 _19719 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), _11090, -1.0);
                    vec3 _20700 = vec3(_19339.w);
                    vec3 _7715 = mix(_19339.xyz, _19719.xyz, _20700);
                    float _20581 = _7715.x;
                    float _13213;
                    vec4 _15671;
                    if (_20581 > 0.0)
                    {
                        vec3 _24007 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec2 _20627 = vec2(_7715.y + (dot(_24007, _24347) + dot(_24007, PerViewLightingConstantBufferGpu_t._m16.xyz)), _7715.z);
                        vec3 _23510;
                        SPIRV_CROSS_BRANCH
                        if (_Globals_.g_bClampSpectrumVSticker1 != 0)
                        {
                            _23510 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker1], g_bindless_Sampler[_Globals_.g_sAnisoClampV]), _20627, -1.0).xyz;
                        }
                        else
                        {
                            _23510 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), _20627, -1.0).xyz;
                        }
                        vec3 _25248 = mix(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker1], g_bindless_Sampler[_Globals_.g_sPoint]), _20627, 0.0).xyz, _23510, _20700);
                        vec3 _19479 = _25248.xyz;
                        float _7246 = dot(saturate(_19479 * _Globals_.g_flSfxColorBoostSticker1).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _19215 = normalize(max(vec3(0.0003000000142492353916168212890625), _19479)) * 1.059999942779541015625;
                        vec3 _13610 = _19215.xyz;
                        vec3 _19118 = max((((_13610 * _Globals_.g_vHoloAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13610))) / vec3(dot(_19215.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19215 * mix(_Globals_.g_vHoloAlbedoLevels.x, _Globals_.g_vHoloAlbedoLevels.z, saturate(pow(max(_25248.x, max(_25248.y, _25248.z)) * _Globals_.g_flSfxColorBoostSticker1, _Globals_.g_vHoloAlbedoLevels.y)))).xyz;
                        vec3 _25193 = mix(_12902.xyz, mix(vec3(_Globals_.g_vHoloAlbedoLevels.x), mix(_19118, min(_Globals_.g_vHoloAlbedoLevels.zzz, _19118 + (vec3(_7246) * _Globals_.g_flSfxColorBoostSticker1)), vec3(max(0.0, _Globals_.g_flSfxColorBoostSticker1 - 1.0) / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vHoloAlbedoLevels.x, _7246), 0.5))), vec3(_20581));
                        vec4 _17849 = _12902;
                        _17849.x = _25193.x;
                        _17849.y = _25193.y;
                        _17849.z = _25193.z;
                        _13213 = _16864 * (1.0 - _20581);
                        _15671 = _17849;
                    }
                    else
                    {
                        _13213 = _16864;
                        _15671 = _12902;
                    }
                    _12021 = _13213;
                    _7480 = _15671;
                }
                else
                {
                    _12021 = _16864;
                    _7480 = _12902;
                }
                float _13153;
                float _14140;
                vec4 _14613;
                if (_Globals_.g_flSticker1Wear > 0.0)
                {
                    vec4 _18114 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tStickerScratches], g_bindless_Sampler[_Globals_.g_sAniso]), _11090, -1.0);
                    float _12595 = 1.0 - min(_Globals_.g_fWearScratchesSticker1, _18114.x);
                    float _12767 = mix(_12595, _12595 * 0.5, _Globals_.g_flSticker1Wear);
                    float _16210 = saturate(mix(_Globals_.g_flSticker1Wear, _Globals_.g_flSticker1Wear + ((2.0 * (_21367.y - 0.5)) * smoothstep(1.0, 0.85000002384185791015625, _Globals_.g_flSticker1Wear)), _Globals_.g_flSticker1Wear));
                    float _20311;
                    if (!_23711)
                    {
                        _20311 = ((_Globals_.g_vWearBiasSticker1.y * ((_Globals_.g_vWearBiasSticker1.y > 0.0) ? 0.5 : 0.25)) + 0.5) * 0.5;
                    }
                    else
                    {
                        _20311 = 0.5;
                    }
                    float _8282 = saturate(_16210 - pow(saturate((_7427 - 0.078431375324726104736328125) * 1.085106372833251953125), _Globals_.g_vWearBiasSticker1.x * _Globals_.g_vWearBiasSticker1.x));
                    vec4 _12022;
                    if (_23711)
                    {
                        float _12206 = saturate(_8282 * 2.0) + (_Globals_.g_vWearBiasSticker1.y * _16210);
                        vec3 _25194 = mix(vec3(mix(0.699999988079071044921875, 0.20000000298023223876953125 + (0.4000000059604644775390625 * _12767), _16210)), _7480.xyz, vec3(smoothstep(_12206, _12206 + 0.100000001490116119384765625, _12767)));
                        vec4 _17850 = _7480;
                        _17850.x = _25194.x;
                        _17850.y = _25194.y;
                        _17850.z = _25194.z;
                        _12022 = _17850;
                    }
                    else
                    {
                        _12022 = _7480;
                    }
                    float _18654 = saturate((_8282 * (1.0 + _20311)) - _20311);
                    float _12508;
                    if (_23709 ? true : (_Globals_.g_bPreserveRoughnessSticker1 != 0))
                    {
                        _12508 = _10565;
                    }
                    else
                    {
                        _12508 = mix(_10565, 0.800000011920928955078125, step(_12767, smoothstep(0.0, 0.3499999940395355224609375, _16210)));
                    }
                    _13153 = _16210;
                    _14140 = _12508;
                    _14613 = vec4(mix(_12022.xyz, _12022.xyz * _12767, vec3(_16210 * 0.300000011920928955078125)), _12022.w * smoothstep(_18654, _18654 + 0.100000001490116119384765625, _12767));
                }
                else
                {
                    _13153 = _Globals_.g_flSticker1Wear;
                    _14140 = _10565;
                    _14613 = _7480;
                }
                vec2 _7734 = mix(_11090 - vec2(0.5), _16344.xy, vec2(_14613.w));
                vec3 _17851 = _16344;
                _17851.x = _7734.x;
                _17851.y = _7734.y;
                vec4 _6621;
                float _13157;
                float _13697;
                float _16317;
                float _17158;
                vec3 _17159;
                if (_23038)
                {
                    float _10422 = saturate(_19306 * 1.111111164093017578125);
                    float _23770 = saturate(_19306 * 2.22222232818603515625);
                    float _9522 = pow(_23770, 0.5);
                    float _25022 = _9984.y;
                    float _10075 = _9522 - _25022;
                    float _6971 = abs(_10075);
                    float _13156;
                    float _16316;
                    vec4 _16491;
                    float _17156;
                    vec3 _17157;
                    float _17193;
                    if (_25022 > _9522)
                    {
                        _13156 = _16222;
                        _16316 = _14140;
                        _17156 = _12021;
                        _17157 = _17851;
                        _17193 = _24306;
                        _16491 = vec4(0.0, 0.0, 0.0, _14613.w * (1.0 - pow(_6971, 0.20000000298023223876953125)));
                    }
                    else
                    {
                        float _9897 = mix(1.0, (_10075 + _9522) + (_6971 * 0.300000011920928955078125), pow(_25022, 0.20000000298023223876953125));
                        vec2 _16974 = _9984;
                        _16974.y = _9897;
                        vec4 _10452;
                        float _12736;
                        float _13154;
                        float _16315;
                        float _17154;
                        vec3 _17155;
                        if (_9897 < 1.0)
                        {
                            vec4 _20992 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker1], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(_16974).xy, -1.0);
                            float _12476 = dot(_20992.xyz, vec3(0.2989999949932098388671875, 0.58700001239776611328125, 0.114000000059604644775390625));
                            vec4 _19621;
                            _19621.x = _12476;
                            _19621.y = _12476;
                            _19621.z = _12476;
                            float _16958 = saturate(_20992.w * 12.75);
                            float _18226 = mix(pow(_6971, 0.100000001490116119384765625), 1.0, _23770);
                            vec3 _10970 = vec3(_16958);
                            _13154 = mix(_16222, _18226, _16958);
                            _16315 = mix(_14140, 0.800000011920928955078125, _16958);
                            _17154 = mix(_12021, 0.0, _16958);
                            _17155 = mix(_17851, vec3(0.0, 0.0, 1.0), _10970);
                            _12736 = mix(_24306, 1.0, _16958);
                            _10452 = vec4(mix(_14613.xyz * _18226, vec4(mix(_19621.xyz, vec3(0.300000011920928955078125), vec3(0.800000011920928955078125)) * pow(_6971, 0.20000000298023223876953125), _16958).xyz, _10970), max(_14613.w, _16958));
                        }
                        else
                        {
                            _13154 = _16222;
                            _16315 = _14140;
                            _17154 = _12021;
                            _17155 = _17851;
                            _12736 = _24306;
                            _10452 = _14613;
                        }
                        vec3 _14960 = mix(_10452.xyz, _10452.xyz * 10.0, vec3(step(0.5, _10422) * pow(smoothstep(1.0, 0.5, _10422), 20.0)));
                        vec4 _17860 = _10452;
                        _17860.x = _14960.x;
                        _17860.y = _14960.y;
                        _17860.z = _14960.z;
                        _13156 = _13154;
                        _16316 = _16315;
                        _17156 = _17154;
                        _17157 = _17155;
                        _17193 = _12736;
                        _16491 = _17860;
                    }
                    _13157 = _13156;
                    _16317 = _16316;
                    _17158 = _17156;
                    _17159 = _17157;
                    _13697 = _17193;
                    _6621 = _16491;
                }
                else
                {
                    _13157 = _16222;
                    _16317 = _14140;
                    _17158 = _12021;
                    _17159 = _17851;
                    _13697 = _24306;
                    _6621 = _14613;
                }
                float _10160 = PerViewConstantBuffer_t._m0 - _Globals_.g_flHighlightTimeSticker1;
                vec4 _20313;
                if (_10160 < 2.0)
                {
                    vec3 _22957 = mix(_6621.xyz, _6621.xyz + vec3(1.0), vec3(pow(1.0 - (_10160 * 0.5), 5.0)));
                    vec4 _17861 = _6621;
                    _17861.x = _22957.x;
                    _17861.y = _22957.y;
                    _17861.z = _22957.z;
                    _20313 = _17861;
                }
                else
                {
                    _20313 = _6621;
                }
                float _12752 = _13697 * _20313.w;
                vec4 _11405;
                vec3 _13158;
                float _15652;
                float _16318;
                float _17160;
                vec3 _17161;
                if (_10235)
                {
                    vec4 _21712;
                    if (_Globals_.g_bActiveStickerMouseOver != 0)
                    {
                        vec3 _8829 = _20313.xyz * 2.0;
                        vec4 _8677 = _20313;
                        _8677.x = _8829.x;
                        _8677.y = _8829.y;
                        _8677.z = _8829.z;
                        _21712 = _8677;
                    }
                    else
                    {
                        _21712 = _20313;
                    }
                    bool _14880 = _Globals_.g_bActiveStickerMoving != 0;
                    float _10003;
                    vec4 _24342;
                    if (_14880)
                    {
                        vec2 _10161 = _11090 * 8.0;
                        vec3 _20329 = vec3(0.20000000298023223876953125) + saturate(vec3(dot(_21712.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) * 0.60000002384185791015625);
                        vec4 _20497 = _21712;
                        _20497.x = _20329.x;
                        _20497.y = _20329.y;
                        _20497.z = _20329.z;
                        vec3 _20314 = _20497.xyz + vec3(fract((floor(_10161.x) + floor(_10161.y)) * 0.5) * 0.20020000636577606201171875);
                        vec4 _20498 = _20497;
                        _20498.x = _20314.x;
                        _20498.y = _20314.y;
                        _20498.z = _20314.z;
                        vec3 _22865 = _20498.xyz * _17148;
                        vec4 _8678 = _20498;
                        _8678.x = _22865.x;
                        _8678.y = _22865.y;
                        _8678.z = _22865.z;
                        _10003 = _12752 * 0.89999997615814208984375;
                        _24342 = _8678;
                    }
                    else
                    {
                        _10003 = _12752;
                        _24342 = _21712;
                    }
                    bvec3 _14011 = bvec3(_14880);
                    _13158 = mix(_13152, vec3(0.0), _14011);
                    _16318 = _14880 ? 0.800000011920928955078125 : _16317;
                    _17160 = _14880 ? 0.0 : _17158;
                    _17161 = mix(_17159, vec3(0.0, 0.0, 1.0), _14011);
                    _15652 = _10003;
                    _11405 = _24342;
                }
                else
                {
                    _13158 = _13152;
                    _16318 = _16317;
                    _17160 = _17158;
                    _17161 = _17159;
                    _15652 = _12752;
                    _11405 = _20313;
                }
                float _13159;
                vec3 _16319;
                vec3 _16492;
                float _17162;
                float _17163;
                vec2 _17164;
                float _17165;
                vec3 _17166;
                vec3 _17167;
                float _17168;
                vec4 _17194;
                if (!(_22789 ? true : _12899))
                {
                    vec3 _23346 = vec3(_15652);
                    vec4 _24455;
                    _24455.x = max(_13696.x, _15652);
                    _24455.w = max(_13696.w, _15652 * (1.0 - _13153));
                    _13159 = _17763 ? _15652 : _19503;
                    _16319 = mix(_16314, _12903, _23346);
                    _17162 = mix(_17140, 0.0, _15652);
                    _17163 = mix(_17141, 0.039999999105930328369140625, _15652);
                    _17164 = mix(_17142.xy, vec2(_16318), vec2(_15652));
                    _17165 = mix(_17143, _17160, _15652);
                    _17166 = normalize(mix(_17146.xyz, _17161, _23346));
                    _17167 = mix(_17147.xyz, saturate(_11405.xyz), _23346);
                    _17168 = mix(_17148, _13157, _11405.w);
                    _17194 = _24455;
                    _16492 = mix(_6619.xyz, _13158, _23346);
                }
                else
                {
                    _13159 = _19503;
                    _16319 = _16314;
                    _17162 = _17140;
                    _17163 = _17141;
                    _17164 = _17142;
                    _17165 = _17143;
                    _17166 = _17146;
                    _17167 = _17147;
                    _17168 = _17148;
                    _17194 = _13696;
                    _16492 = _6619;
                }
                _13160 = _13159;
                _16320 = _16319;
                _17169 = _17162;
                _17170 = _17163;
                _17171 = _17164;
                _17172 = _17165;
                _17173 = _17166;
                _17174 = _17167;
                _17175 = _17168;
                _17195 = _17194;
                _16493 = _16492;
                break;
            } while(false);
            _13161 = _13160;
            _16321 = _16320;
            _17176 = _17169;
            _17177 = _17170;
            _17178 = _17171;
            _17179 = _17172;
            _17180 = _17173;
            _17181 = _17174;
            _17182 = _17175;
            _13698 = _17195;
            _6622 = _16493;
        }
        else
        {
            _13161 = _13149;
            _16321 = _16314;
            _17176 = _17140;
            _17177 = _17141;
            _17178 = _17142;
            _17179 = _17143;
            _17180 = _17146;
            _17181 = _17147;
            _17182 = _17148;
            _13698 = _13696;
            _6622 = _6619;
        }
        bool _12904;
        if (_Globals_.g_bEnableSticker2 != 0)
        {
            _12904 = true;
        }
        else
        {
            _12904 = _Globals_.g_bStickerPreviewForceOn != 0;
        }
        vec3 _6625;
        float _13174;
        vec4 _13700;
        vec3 _16328;
        float _17218;
        float _17219;
        vec2 _17223;
        float _17224;
        vec3 _17225;
        vec3 _17226;
        float _17227;
        if (_12904)
        {
            float _10828 = _Globals_.g_flGlitterScaleSticker2 * (notEqual(PerViewConstantBufferCsgo_t._m2, ivec4(0)).x ? 2.5 : 1.75);
            bool _23719 = _Globals_.g_bAutomaticPBRColorFittingSticker2 != 0;
            bool _23720 = _Globals_.g_bLegacyTintMultiplySticker2 != 0;
            bool _23721 = _Globals_.g_bMetallicSticker2 != 0;
            bool _23723 = _Globals_.g_bPaperBackingSticker2 != 0;
            float _13173;
            vec3 _16327;
            vec3 _16512;
            float _17210;
            float _17211;
            vec2 _17212;
            float _17213;
            vec3 _17214;
            vec3 _17215;
            float _17216;
            vec4 _17217;
            do
            {
                bool _17764 = _24464.y;
                float _19504 = _17764 ? 0.0 : _13161;
                bool _12905;
                if (_Globals_.g_vSticker2Scale.x == 0.0)
                {
                    _12905 = true;
                }
                else
                {
                    _12905 = _Globals_.g_vSticker2Scale.y == 0.0;
                }
                bool _12906;
                if (_12905)
                {
                    _12906 = true;
                }
                else
                {
                    _12906 = _19148 == 0.0;
                }
                if (_12906)
                {
                    _13173 = _19504;
                    _16327 = _16321;
                    _17210 = _17176;
                    _17211 = _17177;
                    _17212 = _17178;
                    _17213 = _17179;
                    _17214 = _17180;
                    _17215 = _17181;
                    _17216 = _17182;
                    _17217 = _13698;
                    _16512 = _6622;
                    break;
                }
                bool _10238 = 3 == _Globals_.g_nActiveStickerApplySlot;
                vec2 _17354 = ((_23261.zw - vec2(0.5)) - _Globals_.g_vSticker2Offset) * abs(_Globals_.g_vSticker2Scale).x;
                float _10691 = _Globals_.g_flSticker2Rotation * 6.28318023681640625;
                float _17506 = _17354.x;
                float _13162 = cos(_10691);
                float _22690 = _17354.y;
                float _20198 = sin(_10691);
                vec2 _15801 = vec2((_17506 * _13162) - (_22690 * _20198), (_17506 * _20198) + (_22690 * _13162)) + vec2(0.5);
                float _10369 = _15801.x;
                bool _12907;
                if (saturate(_10369) != _10369)
                {
                    _12907 = true;
                }
                else
                {
                    float _11831 = _15801.y;
                    _12907 = saturate(_11831) != _11831;
                }
                bool _12908;
                if (_10238)
                {
                    _12908 = _Globals_.g_bActiveStickerMoving == 0;
                }
                else
                {
                    _12908 = false;
                }
                float _19307;
                if (_12908)
                {
                    _19307 = PerViewConstantBuffer_t._m0 - _Globals_.g_bActiveStickerPeelStartTime;
                }
                else
                {
                    _19307 = 0.89999997615814208984375;
                }
                bool _23039 = _19307 < 0.89999997615814208984375;
                vec2 _9988 = saturate(_15801);
                vec2 _11093 = _9988.xy;
                vec4 _20330 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), _11093, -1.0);
                float _7428 = _20330.w;
                float _8482 = saturate(_7428 * 12.75) * _19148;
                vec4 _22298 = _20330;
                _22298.w = _8482;
                uvec2 _10920 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tSticker2], 0));
                vec2 _14461 = vec2(1.0 / float(_10920.x), 1.0 / float(_10920.y));
                vec2 _6347 = textureQueryLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), clamp(_11093, _14461, vec2(1.0) - _14461));
                float _13004 = _6347.x;
                float _8797 = 1.0 - saturate(_13004 - 3.0);
                bool _18605 = _8797 > 0.0;
                vec4 _23170;
                if (_18605)
                {
                    float _15252 = dot(cross(PerViewConstantBuffer_t._m9, PerViewConstantBuffer_t._m8), -_7054);
                    float _24059 = dot(PerViewConstantBuffer_t._m8, _7054);
                    vec4 _17337 = _22298;
                    _17337.w = mix(_8482, max(_8482, (saturate(texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(((_9988 - vec2(0.5)) - (vec2((_15252 * _13162) - (_24059 * _20198), (_15252 * _20198) + (_24059 * _13162)) * 0.00999999977648258209228515625)) + vec2(0.5)).xy, 1.0).w * 12.75) * _19148) * 0.699999988079071044921875), _8797);
                    _23170 = _17337;
                }
                else
                {
                    _23170 = _22298;
                }
                float _24309 = _18605 ? _8482 : 1.0;
                bool _22790;
                if (_23170.w <= 0.0)
                {
                    _22790 = !_23039;
                }
                else
                {
                    _22790 = false;
                }
                vec4 _19377 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormalRoughnessSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), _11093, -1.0);
                float _16006 = _19377.x;
                float _19725 = _19377.y;
                float _16794 = (_16006 + _19725) - 1.00392162799835205078125;
                float _11189 = _16006 - _19725;
                vec3 _15732 = normalize(vec3(vec2(_16794, _11189), (1.0 - abs(_16794)) - abs(_11189)));
                _15732.y = -_15732.y;
                float _20015 = max(_13004, 3.0);
                vec4 _11190 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormal], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20015);
                float _15755 = _11190.x;
                float _17306 = _11190.y;
                float _16795 = (_15755 + _17306) - 1.00392162799835205078125;
                float _11191 = _15755 - _17306;
                vec3 _15733 = normalize(vec3(vec2(_16795, _11191), (1.0 - abs(_16795)) - abs(_11191)));
                _15733.y = -_15733.y;
                vec3 _10178 = normalize(_15733 + ((_15732 * _23170.w) * 2.0));
                float _16223 = min(pow(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tAmbientOcclusion], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20015).x, 0.75), (_24309 * 0.5) + 0.5);
                float _10566 = _19377.z;
                float _13790 = float(_23721);
                vec3 _13164;
                vec3 _16345;
                float _16865;
                if (_Globals_.g_bGlitterSticker2 != 0)
                {
                    vec4 _20331 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), _11093, -1.0);
                    float _16039 = 1.0 - _20331.w;
                    vec3 _13163;
                    vec3 _16383;
                    float _16495;
                    if (_16039 != 0.0)
                    {
                        vec3 _7191 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec4 _16751 = vec4(_9988 * _10828, (vec2(0.5) + _9988) * _10828);
                        vec2 _14101 = _16751.xy;
                        vec2 _12045 = dFdx(_14101);
                        vec2 _22160 = dFdy(_14101);
                        vec2 _8339 = max(_12045, _22160);
                        vec4 _19378 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker2], g_bindless_Sampler[_Globals_.g_sPoint]), _16751.xy);
                        float _16007 = _19378.x;
                        float _19726 = _19378.y;
                        float _16796 = (_16007 + _19726) - 1.00392162799835205078125;
                        float _11192 = _16007 - _19726;
                        vec3 _16017 = normalize(vec3(vec2(_16796, _11192), (1.0 - abs(_16796)) - abs(_11192)));
                        vec3 _22294 = _16017 * _16017.z;
                        vec3 _14757 = _24347.xyz;
                        vec3 _9151 = sin(reflect(_7191, normalize((((input_6.xyz * _22294.x).xyz + (_7424.xyz * _22294.y)).xyz + (_14757 * _22294.z)).xyz)) * 12.0);
                        vec3 _7399 = max(vec3(0.0), (_9151 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17183 = ((vec3(pow(dot(saturate(-_9151).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9151).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7399.xyz + pow(_7399.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _15606 = (0.039999999105930328369140625 * _16039) * saturate(1.0 - (min(_8339.x, _8339.y) * 40.0));
                        vec2 _24095 = _10178.xy + (_22294.xy * _15606);
                        vec3 _20500 = _10178;
                        _20500.x = _24095.x;
                        _20500.y = _24095.y;
                        vec4 _11193 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker2], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _16751.zw, 0.0);
                        float _15756 = _11193.x;
                        float _17308 = _11193.y;
                        float _16799 = (_15756 + _17308) - 1.00392162799835205078125;
                        float _11194 = _15756 - _17308;
                        vec3 _16018 = normalize(vec3(vec2(_16799, _11194), (1.0 - abs(_16799)) - abs(_11194)));
                        vec3 _9152 = sin(reflect(_7191, normalize((((input_6.xyz * _16018.x).xyz + (_7424.xyz * _16018.y)).xyz + (_14757 * _16018.z)).xyz)) * 12.0);
                        vec3 _7400 = max(vec3(0.0), (_9152 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17184 = ((vec3(pow(dot(saturate(-_9152).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9152).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7400.xyz + pow(_7400.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _23818 = _11193.w;
                        vec3 _9759;
                        if (_23719)
                        {
                            vec3 _19216 = normalize(max(vec3(0.0003000000142492353916168212890625), _23170.xyz)) * 1.059999942779541015625;
                            vec3 _13611 = _19216.xyz;
                            _9759 = mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13611 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13611))) / vec3(dot(_19216.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19216 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23170.x, max(_23170.y, _23170.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23170.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz;
                        }
                        else
                        {
                            _9759 = _23170.xyz;
                        }
                        vec2 _13866 = _20500.xy + ((_16018.xy * _15606) * _23818);
                        vec3 _20501 = _20500;
                        _20501.x = _13866.x;
                        _20501.y = _13866.y;
                        _13163 = (max(((_17183 * 0.0500000007450580596923828125) + (_17183 * 0.949999988079071044921875)).xyz * _19378.w, ((_17184 * 0.0500000007450580596923828125) + (_17184 * 0.949999988079071044921875)).xyz * _23818) * (_9759 * _Globals_.g_flSfxColorBoostSticker2)).xyz * _16039;
                        _16383 = _20501;
                        _16495 = max(_13790, _16039 * 0.5);
                    }
                    else
                    {
                        _13163 = _6622.xyz;
                        _16383 = _10178;
                        _16495 = _13790;
                    }
                    _13164 = _13163;
                    _16345 = _16383;
                    _16865 = _16495;
                }
                else
                {
                    _13164 = _6622.xyz;
                    _16345 = _10178;
                    _16865 = _13790;
                }
                vec4 _12910;
                if (_23719)
                {
                    vec3 _24158 = vec3(_16865);
                    vec3 _13749 = mix(vec3(1.0), _Globals_.g_vColorTintSticker2.xyz, _24158);
                    float _11984 = mix(0.0, _Globals_.g_flTintSaturateSticker2, _16865);
                    vec4 _12510;
                    if (_23720)
                    {
                        vec3 _22771 = mix(_23170.xyz, vec3(dot(_23170.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_11984));
                        vec4 _17864 = _23170;
                        _17864.x = _22771.x;
                        _17864.y = _22771.y;
                        _17864.z = _22771.z;
                        vec3 _16498 = saturate(_17864.xyz * _13749);
                        float _15336 = _16498.x;
                        vec4 _13516 = _17864;
                        _13516.x = _15336;
                        float _21840 = _16498.y;
                        _13516.y = _21840;
                        float _21789 = _16498.z;
                        _13516.z = _21789;
                        vec3 _24049 = normalize(max(vec3(0.0003000000142492353916168212890625), _13516.xyz)) * 1.059999942779541015625;
                        float _6675 = dot(saturate(_13516.xyz * _Globals_.g_flColorBoostSticker2).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12763 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6675))), _24158);
                        float _20085 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16865);
                        vec3 _22781 = _24049.xyz;
                        vec3 _19120 = max((((_22781 * _20085) * 1.73199999332427978515625) / vec3(length(_22781))) / vec3(dot(_24049.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _24049 * mix(_12763.x, _12763.z, saturate(pow(max(_15336, max(_21840, _21789)) * _Globals_.g_flColorBoostSticker2, _12763.y)))).xyz;
                        vec3 _22941 = mix(vec3(_20085), mix(_19120, min(_12763.zzz, _19120 + vec3(_6675)), vec3(max(0.0, _Globals_.g_flColorBoostSticker2 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20085, _6675), 0.5)));
                        vec4 _13895 = _13516;
                        _13895.x = _22941.x;
                        _13895.y = _22941.y;
                        _13895.z = _22941.z;
                        _12510 = _13895;
                    }
                    else
                    {
                        vec3 _18075 = _13749.xyz;
                        vec3 _10734 = normalize(max(vec3(0.0003000000142492353916168212890625), mix(_18075 * _23170.xyz, _18075, vec3(_11984)).xyz)) * 1.059999942779541015625;
                        float _6674 = dot(saturate(_23170.xyz * _Globals_.g_flColorBoostSticker2).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12762 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6674))), _24158);
                        float _20084 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16865);
                        vec3 _22780 = _10734.xyz;
                        vec3 _19119 = max((((_22780 * _20084) * 1.73199999332427978515625) / vec3(length(_22780))) / vec3(dot(_10734.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _10734 * mix(_12762.x, _12762.z, saturate(pow(max(_23170.x, max(_23170.y, _23170.z)) * _Globals_.g_flColorBoostSticker2, _12762.y)))).xyz;
                        vec3 _22940 = mix(vec3(_20084), mix(_19119, min(_12762.zzz, _19119 + vec3(_6674)), vec3(max(0.0, _Globals_.g_flColorBoostSticker2 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20084, _6674), 0.5)));
                        vec4 _13894 = _23170;
                        _13894.x = _22940.x;
                        _13894.y = _22940.y;
                        _13894.z = _22940.z;
                        _12510 = _13894;
                    }
                    _12910 = _12510;
                }
                else
                {
                    vec4 _12509;
                    if (_23721)
                    {
                        vec3 _20061 = mix(_23170.xyz, vec3(dot(_23170.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_Globals_.g_flTintSaturateSticker2)) * _Globals_.g_vColorTintSticker2.xyz;
                        vec4 _23728 = _23170;
                        _23728.x = _20061.x;
                        _23728.y = _20061.y;
                        _23728.z = _20061.z;
                        vec3 _24689 = _23728.xyz * (_23720 ? _Globals_.g_flColorBoostSticker2 : 1.0);
                        vec4 _8679 = _23728;
                        _8679.x = _24689.x;
                        _8679.y = _24689.y;
                        _8679.z = _24689.z;
                        _12509 = _8679;
                    }
                    else
                    {
                        _12509 = _23170;
                    }
                    _12910 = _12509;
                }
                vec3 _12911;
                if (_Globals_.g_bSelfIllumSticker2 != 0)
                {
                    _12911 = (_12910.xyz * _19377.w) * 2.0;
                }
                else
                {
                    _12911 = vec3(0.0);
                }
                vec4 _7481;
                float _12032;
                if (_Globals_.g_bHolographicSticker2 != 0)
                {
                    vec4 _19340 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker2], g_bindless_Sampler[_Globals_.g_sPoint]), _11093, -1.0);
                    vec4 _19727 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), _11093, -1.0);
                    vec3 _20706 = vec3(_19340.w);
                    vec3 _7716 = mix(_19340.xyz, _19727.xyz, _20706);
                    float _20586 = _7716.x;
                    float _13214;
                    vec4 _15675;
                    if (_20586 > 0.0)
                    {
                        vec3 _24008 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec2 _20628 = vec2(_7716.y + (dot(_24008, _24347) + dot(_24008, PerViewLightingConstantBufferGpu_t._m16.xyz)), _7716.z);
                        vec3 _23511;
                        SPIRV_CROSS_BRANCH
                        if (_Globals_.g_bClampSpectrumVSticker2 != 0)
                        {
                            _23511 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker2], g_bindless_Sampler[_Globals_.g_sAnisoClampV]), _20628, -1.0).xyz;
                        }
                        else
                        {
                            _23511 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), _20628, -1.0).xyz;
                        }
                        vec3 _25249 = mix(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker2], g_bindless_Sampler[_Globals_.g_sPoint]), _20628, 0.0).xyz, _23511, _20706);
                        vec3 _19481 = _25249.xyz;
                        float _7250 = dot(saturate(_19481 * _Globals_.g_flSfxColorBoostSticker2).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _19217 = normalize(max(vec3(0.0003000000142492353916168212890625), _19481)) * 1.059999942779541015625;
                        vec3 _13612 = _19217.xyz;
                        vec3 _19121 = max((((_13612 * _Globals_.g_vHoloAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13612))) / vec3(dot(_19217.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19217 * mix(_Globals_.g_vHoloAlbedoLevels.x, _Globals_.g_vHoloAlbedoLevels.z, saturate(pow(max(_25249.x, max(_25249.y, _25249.z)) * _Globals_.g_flSfxColorBoostSticker2, _Globals_.g_vHoloAlbedoLevels.y)))).xyz;
                        vec3 _25195 = mix(_12910.xyz, mix(vec3(_Globals_.g_vHoloAlbedoLevels.x), mix(_19121, min(_Globals_.g_vHoloAlbedoLevels.zzz, _19121 + (vec3(_7250) * _Globals_.g_flSfxColorBoostSticker2)), vec3(max(0.0, _Globals_.g_flSfxColorBoostSticker2 - 1.0) / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vHoloAlbedoLevels.x, _7250), 0.5))), vec3(_20586));
                        vec4 _17867 = _12910;
                        _17867.x = _25195.x;
                        _17867.y = _25195.y;
                        _17867.z = _25195.z;
                        _13214 = _16865 * (1.0 - _20586);
                        _15675 = _17867;
                    }
                    else
                    {
                        _13214 = _16865;
                        _15675 = _12910;
                    }
                    _12032 = _13214;
                    _7481 = _15675;
                }
                else
                {
                    _12032 = _16865;
                    _7481 = _12910;
                }
                float _13165;
                float _14141;
                vec4 _14620;
                if (_Globals_.g_flSticker2Wear > 0.0)
                {
                    vec4 _18127 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tStickerScratches], g_bindless_Sampler[_Globals_.g_sAniso]), _11093, -1.0);
                    float _12596 = 1.0 - min(_Globals_.g_fWearScratchesSticker2, _18127.x);
                    float _12768 = mix(_12596, _12596 * 0.5, _Globals_.g_flSticker2Wear);
                    float _16213 = saturate(mix(_Globals_.g_flSticker2Wear, _Globals_.g_flSticker2Wear + ((2.0 * (_21367.y - 0.5)) * smoothstep(1.0, 0.85000002384185791015625, _Globals_.g_flSticker2Wear)), _Globals_.g_flSticker2Wear));
                    float _20315;
                    if (!_23723)
                    {
                        _20315 = ((_Globals_.g_vWearBiasSticker2.y * ((_Globals_.g_vWearBiasSticker2.y > 0.0) ? 0.5 : 0.25)) + 0.5) * 0.5;
                    }
                    else
                    {
                        _20315 = 0.5;
                    }
                    float _8283 = saturate(_16213 - pow(saturate((_7428 - 0.078431375324726104736328125) * 1.085106372833251953125), _Globals_.g_vWearBiasSticker2.x * _Globals_.g_vWearBiasSticker2.x));
                    vec4 _12033;
                    if (_23723)
                    {
                        float _12207 = saturate(_8283 * 2.0) + (_Globals_.g_vWearBiasSticker2.y * _16213);
                        vec3 _25196 = mix(vec3(mix(0.699999988079071044921875, 0.20000000298023223876953125 + (0.4000000059604644775390625 * _12768), _16213)), _7481.xyz, vec3(smoothstep(_12207, _12207 + 0.100000001490116119384765625, _12768)));
                        vec4 _17868 = _7481;
                        _17868.x = _25196.x;
                        _17868.y = _25196.y;
                        _17868.z = _25196.z;
                        _12033 = _17868;
                    }
                    else
                    {
                        _12033 = _7481;
                    }
                    float _18655 = saturate((_8283 * (1.0 + _20315)) - _20315);
                    float _12512;
                    if (_23721 ? true : (_Globals_.g_bPreserveRoughnessSticker2 != 0))
                    {
                        _12512 = _10566;
                    }
                    else
                    {
                        _12512 = mix(_10566, 0.800000011920928955078125, step(_12768, smoothstep(0.0, 0.3499999940395355224609375, _16213)));
                    }
                    _13165 = _16213;
                    _14141 = _12512;
                    _14620 = vec4(mix(_12033.xyz, _12033.xyz * _12768, vec3(_16213 * 0.300000011920928955078125)), _12033.w * smoothstep(_18655, _18655 + 0.100000001490116119384765625, _12768));
                }
                else
                {
                    _13165 = _Globals_.g_flSticker2Wear;
                    _14141 = _10566;
                    _14620 = _7481;
                }
                vec2 _7738 = mix(_11093 - vec2(0.5), _16345.xy, vec2(_14620.w));
                vec3 _17869 = _16345;
                _17869.x = _7738.x;
                _17869.y = _7738.y;
                vec4 _6624;
                float _13170;
                float _13699;
                float _16324;
                float _17198;
                vec3 _17199;
                if (_23039)
                {
                    float _10423 = saturate(_19307 * 1.111111164093017578125);
                    float _23772 = saturate(_19307 * 2.22222232818603515625);
                    float _9523 = pow(_23772, 0.5);
                    float _25023 = _9988.y;
                    float _10076 = _9523 - _25023;
                    float _6976 = abs(_10076);
                    float _13169;
                    float _16323;
                    vec4 _16501;
                    float _17189;
                    vec3 _17196;
                    float _17197;
                    if (_25023 > _9523)
                    {
                        _13169 = _16223;
                        _16323 = _14141;
                        _17189 = _12032;
                        _17196 = _17869;
                        _17197 = _24309;
                        _16501 = vec4(0.0, 0.0, 0.0, _14620.w * (1.0 - pow(_6976, 0.20000000298023223876953125)));
                    }
                    else
                    {
                        float _9900 = mix(1.0, (_10076 + _9523) + (_6976 * 0.300000011920928955078125), pow(_25023, 0.20000000298023223876953125));
                        vec2 _16975 = _9988;
                        _16975.y = _9900;
                        vec4 _10453;
                        float _12737;
                        float _13166;
                        float _16322;
                        float _17187;
                        vec3 _17188;
                        if (_9900 < 1.0)
                        {
                            vec4 _20993 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker2], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(_16975).xy, -1.0);
                            float _12477 = dot(_20993.xyz, vec3(0.2989999949932098388671875, 0.58700001239776611328125, 0.114000000059604644775390625));
                            vec4 _19622;
                            _19622.x = _12477;
                            _19622.y = _12477;
                            _19622.z = _12477;
                            float _16959 = saturate(_20993.w * 12.75);
                            float _18227 = mix(pow(_6976, 0.100000001490116119384765625), 1.0, _23772);
                            vec3 _10980 = vec3(_16959);
                            _13166 = mix(_16223, _18227, _16959);
                            _16322 = mix(_14141, 0.800000011920928955078125, _16959);
                            _17187 = mix(_12032, 0.0, _16959);
                            _17188 = mix(_17869, vec3(0.0, 0.0, 1.0), _10980);
                            _12737 = mix(_24309, 1.0, _16959);
                            _10453 = vec4(mix(_14620.xyz * _18227, vec4(mix(_19622.xyz, vec3(0.300000011920928955078125), vec3(0.800000011920928955078125)) * pow(_6976, 0.20000000298023223876953125), _16959).xyz, _10980), max(_14620.w, _16959));
                        }
                        else
                        {
                            _13166 = _16223;
                            _16322 = _14141;
                            _17187 = _12032;
                            _17188 = _17869;
                            _12737 = _24309;
                            _10453 = _14620;
                        }
                        vec3 _14961 = mix(_10453.xyz, _10453.xyz * 10.0, vec3(step(0.5, _10423) * pow(smoothstep(1.0, 0.5, _10423), 20.0)));
                        vec4 _17870 = _10453;
                        _17870.x = _14961.x;
                        _17870.y = _14961.y;
                        _17870.z = _14961.z;
                        _13169 = _13166;
                        _16323 = _16322;
                        _17189 = _17187;
                        _17196 = _17188;
                        _17197 = _12737;
                        _16501 = _17870;
                    }
                    _13170 = _13169;
                    _16324 = _16323;
                    _17198 = _17189;
                    _17199 = _17196;
                    _13699 = _17197;
                    _6624 = _16501;
                }
                else
                {
                    _13170 = _16223;
                    _16324 = _14141;
                    _17198 = _12032;
                    _17199 = _17869;
                    _13699 = _24309;
                    _6624 = _14620;
                }
                float _10162 = PerViewConstantBuffer_t._m0 - _Globals_.g_flHighlightTimeSticker2;
                vec4 _20316;
                if (_10162 < 2.0)
                {
                    vec3 _22958 = mix(_6624.xyz, _6624.xyz + vec3(1.0), vec3(pow(1.0 - (_10162 * 0.5), 5.0)));
                    vec4 _17871 = _6624;
                    _17871.x = _22958.x;
                    _17871.y = _22958.y;
                    _17871.z = _22958.z;
                    _20316 = _17871;
                }
                else
                {
                    _20316 = _6624;
                }
                float _12753 = _13699 * _20316.w;
                vec4 _11407;
                vec3 _13171;
                float _15653;
                float _16325;
                float _17200;
                vec3 _17201;
                if (_10238)
                {
                    vec4 _21713;
                    if (_Globals_.g_bActiveStickerMouseOver != 0)
                    {
                        vec3 _8830 = _20316.xyz * 2.0;
                        vec4 _8680 = _20316;
                        _8680.x = _8830.x;
                        _8680.y = _8830.y;
                        _8680.z = _8830.z;
                        _21713 = _8680;
                    }
                    else
                    {
                        _21713 = _20316;
                    }
                    bool _14883 = _Globals_.g_bActiveStickerMoving != 0;
                    float _10004;
                    vec4 _24348;
                    if (_14883)
                    {
                        vec2 _10163 = _11093 * 8.0;
                        vec3 _20333 = vec3(0.20000000298023223876953125) + saturate(vec3(dot(_21713.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) * 0.60000002384185791015625);
                        vec4 _20502 = _21713;
                        _20502.x = _20333.x;
                        _20502.y = _20333.y;
                        _20502.z = _20333.z;
                        vec3 _20317 = _20502.xyz + vec3(fract((floor(_10163.x) + floor(_10163.y)) * 0.5) * 0.20020000636577606201171875);
                        vec4 _20503 = _20502;
                        _20503.x = _20317.x;
                        _20503.y = _20317.y;
                        _20503.z = _20317.z;
                        vec3 _22868 = _20503.xyz * _17182;
                        vec4 _8681 = _20503;
                        _8681.x = _22868.x;
                        _8681.y = _22868.y;
                        _8681.z = _22868.z;
                        _10004 = _12753 * 0.89999997615814208984375;
                        _24348 = _8681;
                    }
                    else
                    {
                        _10004 = _12753;
                        _24348 = _21713;
                    }
                    bvec3 _14013 = bvec3(_14883);
                    _13171 = mix(_13164, vec3(0.0), _14013);
                    _16325 = _14883 ? 0.800000011920928955078125 : _16324;
                    _17200 = _14883 ? 0.0 : _17198;
                    _17201 = mix(_17199, vec3(0.0, 0.0, 1.0), _14013);
                    _15653 = _10004;
                    _11407 = _24348;
                }
                else
                {
                    _13171 = _13164;
                    _16325 = _16324;
                    _17200 = _17198;
                    _17201 = _17199;
                    _15653 = _12753;
                    _11407 = _20316;
                }
                float _13172;
                vec3 _16326;
                vec3 _16508;
                float _17202;
                float _17203;
                vec2 _17204;
                float _17205;
                vec3 _17206;
                vec3 _17207;
                float _17208;
                vec4 _17209;
                if (!(_22790 ? true : _12907))
                {
                    vec3 _23347 = vec3(_15653);
                    vec4 _24456;
                    _24456.x = max(_13698.x, _15653);
                    _24456.w = max(_13698.w, _15653 * (1.0 - _13165));
                    _13172 = _17764 ? _15653 : _19504;
                    _16326 = mix(_16321, _12911, _23347);
                    _17202 = mix(_17176, 0.0, _15653);
                    _17203 = mix(_17177, 0.039999999105930328369140625, _15653);
                    _17204 = mix(_17178.xy, vec2(_16325), vec2(_15653));
                    _17205 = mix(_17179, _17200, _15653);
                    _17206 = normalize(mix(_17180.xyz, _17201, _23347));
                    _17207 = mix(_17181.xyz, saturate(_11407.xyz), _23347);
                    _17208 = mix(_17182, _13170, _11407.w);
                    _17209 = _24456;
                    _16508 = mix(_6622.xyz, _13171, _23347);
                }
                else
                {
                    _13172 = _19504;
                    _16326 = _16321;
                    _17202 = _17176;
                    _17203 = _17177;
                    _17204 = _17178;
                    _17205 = _17179;
                    _17206 = _17180;
                    _17207 = _17181;
                    _17208 = _17182;
                    _17209 = _13698;
                    _16508 = _6622;
                }
                _13173 = _13172;
                _16327 = _16326;
                _17210 = _17202;
                _17211 = _17203;
                _17212 = _17204;
                _17213 = _17205;
                _17214 = _17206;
                _17215 = _17207;
                _17216 = _17208;
                _17217 = _17209;
                _16512 = _16508;
                break;
            } while(false);
            _13174 = _13173;
            _16328 = _16327;
            _17218 = _17210;
            _17219 = _17211;
            _17223 = _17212;
            _17224 = _17213;
            _17225 = _17214;
            _17226 = _17215;
            _17227 = _17216;
            _13700 = _17217;
            _6625 = _16512;
        }
        else
        {
            _13174 = _13161;
            _16328 = _16321;
            _17218 = _17176;
            _17219 = _17177;
            _17223 = _17178;
            _17224 = _17179;
            _17225 = _17180;
            _17226 = _17181;
            _17227 = _17182;
            _13700 = _13698;
            _6625 = _6622;
        }
        bool _12913;
        if (_Globals_.g_bEnableSticker3 != 0)
        {
            _12913 = true;
        }
        else
        {
            _12913 = _Globals_.g_bStickerPreviewForceOn != 0;
        }
        vec3 _6628;
        float _13194;
        vec4 _13703;
        vec3 _16339;
        float _17262;
        float _17263;
        vec2 _17264;
        float _17265;
        vec3 _17266;
        vec3 _17267;
        float _17268;
        if (_12913)
        {
            float _10829 = _Globals_.g_flGlitterScaleSticker3 * (notEqual(PerViewConstantBufferCsgo_t._m2, ivec4(0)).x ? 2.5 : 1.75);
            bool _23729 = _Globals_.g_bAutomaticPBRColorFittingSticker3 != 0;
            bool _23730 = _Globals_.g_bLegacyTintMultiplySticker3 != 0;
            bool _23731 = _Globals_.g_bMetallicSticker3 != 0;
            bool _23733 = _Globals_.g_bPaperBackingSticker3 != 0;
            float _13193;
            vec3 _16334;
            vec3 _16531;
            float _17254;
            float _17255;
            vec2 _17256;
            float _17257;
            vec3 _17258;
            vec3 _17259;
            float _17260;
            vec4 _17261;
            do
            {
                bool _17765 = _24464.y;
                float _19505 = _17765 ? 0.0 : _13174;
                bool _12914;
                if (_Globals_.g_vSticker3Scale.x == 0.0)
                {
                    _12914 = true;
                }
                else
                {
                    _12914 = _Globals_.g_vSticker3Scale.y == 0.0;
                }
                bool _12915;
                if (_12914)
                {
                    _12915 = true;
                }
                else
                {
                    _12915 = _19148 == 0.0;
                }
                if (_12915)
                {
                    _13193 = _19505;
                    _16334 = _16328;
                    _17254 = _17218;
                    _17255 = _17219;
                    _17256 = _17223;
                    _17257 = _17224;
                    _17258 = _17225;
                    _17259 = _17226;
                    _17260 = _17227;
                    _17261 = _13700;
                    _16531 = _6625;
                    break;
                }
                bool _10240 = 4 == _Globals_.g_nActiveStickerApplySlot;
                vec2 _17355 = ((_23261.zw - vec2(0.5)) - _Globals_.g_vSticker3Offset) * abs(_Globals_.g_vSticker3Scale).x;
                float _10692 = _Globals_.g_flSticker3Rotation * 6.28318023681640625;
                float _17507 = _17355.x;
                float _13175 = cos(_10692);
                float _22692 = _17355.y;
                float _20199 = sin(_10692);
                vec2 _15802 = vec2((_17507 * _13175) - (_22692 * _20199), (_17507 * _20199) + (_22692 * _13175)) + vec2(0.5);
                float _10370 = _15802.x;
                bool _12916;
                if (saturate(_10370) != _10370)
                {
                    _12916 = true;
                }
                else
                {
                    float _11832 = _15802.y;
                    _12916 = saturate(_11832) != _11832;
                }
                bool _12917;
                if (_10240)
                {
                    _12917 = _Globals_.g_bActiveStickerMoving == 0;
                }
                else
                {
                    _12917 = false;
                }
                float _19308;
                if (_12917)
                {
                    _19308 = PerViewConstantBuffer_t._m0 - _Globals_.g_bActiveStickerPeelStartTime;
                }
                else
                {
                    _19308 = 0.89999997615814208984375;
                }
                bool _23040 = _19308 < 0.89999997615814208984375;
                vec2 _9993 = saturate(_15802);
                vec2 _11096 = _9993.xy;
                vec4 _20334 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), _11096, -1.0);
                float _7434 = _20334.w;
                float _8483 = saturate(_7434 * 12.75) * _19148;
                vec4 _22299 = _20334;
                _22299.w = _8483;
                uvec2 _10921 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tSticker3], 0));
                vec2 _14462 = vec2(1.0 / float(_10921.x), 1.0 / float(_10921.y));
                vec2 _6348 = textureQueryLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), clamp(_11096, _14462, vec2(1.0) - _14462));
                float _13005 = _6348.x;
                float _8798 = 1.0 - saturate(_13005 - 3.0);
                bool _18606 = _8798 > 0.0;
                vec4 _23176;
                if (_18606)
                {
                    float _15253 = dot(cross(PerViewConstantBuffer_t._m9, PerViewConstantBuffer_t._m8), -_7054);
                    float _24063 = dot(PerViewConstantBuffer_t._m8, _7054);
                    vec4 _17338 = _22299;
                    _17338.w = mix(_8483, max(_8483, (saturate(texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(((_9993 - vec2(0.5)) - (vec2((_15253 * _13175) - (_24063 * _20199), (_15253 * _20199) + (_24063 * _13175)) * 0.00999999977648258209228515625)) + vec2(0.5)).xy, 1.0).w * 12.75) * _19148) * 0.699999988079071044921875), _8798);
                    _23176 = _17338;
                }
                else
                {
                    _23176 = _22299;
                }
                float _24311 = _18606 ? _8483 : 1.0;
                bool _22791;
                if (_23176.w <= 0.0)
                {
                    _22791 = !_23040;
                }
                else
                {
                    _22791 = false;
                }
                vec4 _19379 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormalRoughnessSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), _11096, -1.0);
                float _16010 = _19379.x;
                float _19728 = _19379.y;
                float _16802 = (_16010 + _19728) - 1.00392162799835205078125;
                float _11195 = _16010 - _19728;
                vec3 _15734 = normalize(vec3(vec2(_16802, _11195), (1.0 - abs(_16802)) - abs(_11195)));
                _15734.y = -_15734.y;
                float _20017 = max(_13005, 3.0);
                vec4 _11196 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormal], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20017);
                float _15757 = _11196.x;
                float _17310 = _11196.y;
                float _16803 = (_15757 + _17310) - 1.00392162799835205078125;
                float _11197 = _15757 - _17310;
                vec3 _15735 = normalize(vec3(vec2(_16803, _11197), (1.0 - abs(_16803)) - abs(_11197)));
                _15735.y = -_15735.y;
                vec3 _10179 = normalize(_15735 + ((_15734 * _23176.w) * 2.0));
                float _16224 = min(pow(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tAmbientOcclusion], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20017).x, 0.75), (_24311 * 0.5) + 0.5);
                float _10567 = _19379.z;
                float _13791 = float(_23731);
                vec3 _13185;
                vec3 _16346;
                float _16866;
                if (_Globals_.g_bGlitterSticker3 != 0)
                {
                    vec4 _20335 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), _11096, -1.0);
                    float _16040 = 1.0 - _20335.w;
                    vec3 _13184;
                    vec3 _16384;
                    float _16515;
                    if (_16040 != 0.0)
                    {
                        vec3 _7192 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec4 _16752 = vec4(_9993 * _10829, (vec2(0.5) + _9993) * _10829);
                        vec2 _14105 = _16752.xy;
                        vec2 _12046 = dFdx(_14105);
                        vec2 _22176 = dFdy(_14105);
                        vec2 _8340 = max(_12046, _22176);
                        vec4 _19380 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker3], g_bindless_Sampler[_Globals_.g_sPoint]), _16752.xy);
                        float _16011 = _19380.x;
                        float _19729 = _19380.y;
                        float _16804 = (_16011 + _19729) - 1.00392162799835205078125;
                        float _11198 = _16011 - _19729;
                        vec3 _16019 = normalize(vec3(vec2(_16804, _11198), (1.0 - abs(_16804)) - abs(_11198)));
                        vec3 _22295 = _16019 * _16019.z;
                        vec3 _14758 = _24347.xyz;
                        vec3 _9153 = sin(reflect(_7192, normalize((((input_6.xyz * _22295.x).xyz + (_7424.xyz * _22295.y)).xyz + (_14758 * _22295.z)).xyz)) * 12.0);
                        vec3 _7401 = max(vec3(0.0), (_9153 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17229 = ((vec3(pow(dot(saturate(-_9153).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9153).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7401.xyz + pow(_7401.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _15615 = (0.039999999105930328369140625 * _16040) * saturate(1.0 - (min(_8340.x, _8340.y) * 40.0));
                        vec2 _24096 = _10179.xy + (_22295.xy * _15615);
                        vec3 _20505 = _10179;
                        _20505.x = _24096.x;
                        _20505.y = _24096.y;
                        vec4 _11199 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker3], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _16752.zw, 0.0);
                        float _15758 = _11199.x;
                        float _17312 = _11199.y;
                        float _16805 = (_15758 + _17312) - 1.00392162799835205078125;
                        float _11200 = _15758 - _17312;
                        vec3 _16020 = normalize(vec3(vec2(_16805, _11200), (1.0 - abs(_16805)) - abs(_11200)));
                        vec3 _9154 = sin(reflect(_7192, normalize((((input_6.xyz * _16020.x).xyz + (_7424.xyz * _16020.y)).xyz + (_14758 * _16020.z)).xyz)) * 12.0);
                        vec3 _7402 = max(vec3(0.0), (_9154 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17230 = ((vec3(pow(dot(saturate(-_9154).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9154).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7402.xyz + pow(_7402.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _23827 = _11199.w;
                        vec3 _9761;
                        if (_23729)
                        {
                            vec3 _19218 = normalize(max(vec3(0.0003000000142492353916168212890625), _23176.xyz)) * 1.059999942779541015625;
                            vec3 _13613 = _19218.xyz;
                            _9761 = mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13613 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13613))) / vec3(dot(_19218.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19218 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23176.x, max(_23176.y, _23176.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23176.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz;
                        }
                        else
                        {
                            _9761 = _23176.xyz;
                        }
                        vec2 _13868 = _20505.xy + ((_16020.xy * _15615) * _23827);
                        vec3 _20506 = _20505;
                        _20506.x = _13868.x;
                        _20506.y = _13868.y;
                        _13184 = (max(((_17229 * 0.0500000007450580596923828125) + (_17229 * 0.949999988079071044921875)).xyz * _19380.w, ((_17230 * 0.0500000007450580596923828125) + (_17230 * 0.949999988079071044921875)).xyz * _23827) * (_9761 * _Globals_.g_flSfxColorBoostSticker3)).xyz * _16040;
                        _16384 = _20506;
                        _16515 = max(_13791, _16040 * 0.5);
                    }
                    else
                    {
                        _13184 = _6625.xyz;
                        _16384 = _10179;
                        _16515 = _13791;
                    }
                    _13185 = _13184;
                    _16346 = _16384;
                    _16866 = _16515;
                }
                else
                {
                    _13185 = _6625.xyz;
                    _16346 = _10179;
                    _16866 = _13791;
                }
                vec4 _12919;
                if (_23729)
                {
                    vec3 _24159 = vec3(_16866);
                    vec3 _13750 = mix(vec3(1.0), _Globals_.g_vColorTintSticker3.xyz, _24159);
                    float _11985 = mix(0.0, _Globals_.g_flTintSaturateSticker3, _16866);
                    vec4 _12514;
                    if (_23730)
                    {
                        vec3 _22772 = mix(_23176.xyz, vec3(dot(_23176.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_11985));
                        vec4 _17874 = _23176;
                        _17874.x = _22772.x;
                        _17874.y = _22772.y;
                        _17874.z = _22772.z;
                        vec3 _16519 = saturate(_17874.xyz * _13750);
                        float _15337 = _16519.x;
                        vec4 _13521 = _17874;
                        _13521.x = _15337;
                        float _21852 = _16519.y;
                        _13521.y = _21852;
                        float _21799 = _16519.z;
                        _13521.z = _21799;
                        vec3 _24051 = normalize(max(vec3(0.0003000000142492353916168212890625), _13521.xyz)) * 1.059999942779541015625;
                        float _6677 = dot(saturate(_13521.xyz * _Globals_.g_flColorBoostSticker3).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12769 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6677))), _24159);
                        float _20087 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16866);
                        vec3 _22783 = _24051.xyz;
                        vec3 _19123 = max((((_22783 * _20087) * 1.73199999332427978515625) / vec3(length(_22783))) / vec3(dot(_24051.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _24051 * mix(_12769.x, _12769.z, saturate(pow(max(_15337, max(_21852, _21799)) * _Globals_.g_flColorBoostSticker3, _12769.y)))).xyz;
                        vec3 _22943 = mix(vec3(_20087), mix(_19123, min(_12769.zzz, _19123 + vec3(_6677)), vec3(max(0.0, _Globals_.g_flColorBoostSticker3 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20087, _6677), 0.5)));
                        vec4 _13898 = _13521;
                        _13898.x = _22943.x;
                        _13898.y = _22943.y;
                        _13898.z = _22943.z;
                        _12514 = _13898;
                    }
                    else
                    {
                        vec3 _18076 = _13750.xyz;
                        vec3 _10735 = normalize(max(vec3(0.0003000000142492353916168212890625), mix(_18076 * _23176.xyz, _18076, vec3(_11985)).xyz)) * 1.059999942779541015625;
                        float _6676 = dot(saturate(_23176.xyz * _Globals_.g_flColorBoostSticker3).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12765 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6676))), _24159);
                        float _20086 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16866);
                        vec3 _22782 = _10735.xyz;
                        vec3 _19122 = max((((_22782 * _20086) * 1.73199999332427978515625) / vec3(length(_22782))) / vec3(dot(_10735.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _10735 * mix(_12765.x, _12765.z, saturate(pow(max(_23176.x, max(_23176.y, _23176.z)) * _Globals_.g_flColorBoostSticker3, _12765.y)))).xyz;
                        vec3 _22942 = mix(vec3(_20086), mix(_19122, min(_12765.zzz, _19122 + vec3(_6676)), vec3(max(0.0, _Globals_.g_flColorBoostSticker3 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20086, _6676), 0.5)));
                        vec4 _13897 = _23176;
                        _13897.x = _22942.x;
                        _13897.y = _22942.y;
                        _13897.z = _22942.z;
                        _12514 = _13897;
                    }
                    _12919 = _12514;
                }
                else
                {
                    vec4 _12513;
                    if (_23731)
                    {
                        vec3 _20062 = mix(_23176.xyz, vec3(dot(_23176.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_Globals_.g_flTintSaturateSticker3)) * _Globals_.g_vColorTintSticker3.xyz;
                        vec4 _23738 = _23176;
                        _23738.x = _20062.x;
                        _23738.y = _20062.y;
                        _23738.z = _20062.z;
                        vec3 _24690 = _23738.xyz * (_23730 ? _Globals_.g_flColorBoostSticker3 : 1.0);
                        vec4 _8682 = _23738;
                        _8682.x = _24690.x;
                        _8682.y = _24690.y;
                        _8682.z = _24690.z;
                        _12513 = _8682;
                    }
                    else
                    {
                        _12513 = _23176;
                    }
                    _12919 = _12513;
                }
                vec3 _12920;
                if (_Globals_.g_bSelfIllumSticker3 != 0)
                {
                    _12920 = (_12919.xyz * _19379.w) * 2.0;
                }
                else
                {
                    _12920 = vec3(0.0);
                }
                vec4 _7483;
                float _12042;
                if (_Globals_.g_bHolographicSticker3 != 0)
                {
                    vec4 _19341 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker3], g_bindless_Sampler[_Globals_.g_sPoint]), _11096, -1.0);
                    vec4 _19730 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), _11096, -1.0);
                    vec3 _20713 = vec3(_19341.w);
                    vec3 _7717 = mix(_19341.xyz, _19730.xyz, _20713);
                    float _20595 = _7717.x;
                    float _13215;
                    vec4 _15677;
                    if (_20595 > 0.0)
                    {
                        vec3 _24021 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec2 _20629 = vec2(_7717.y + (dot(_24021, _24347) + dot(_24021, PerViewLightingConstantBufferGpu_t._m16.xyz)), _7717.z);
                        vec3 _23512;
                        SPIRV_CROSS_BRANCH
                        if (_Globals_.g_bClampSpectrumVSticker3 != 0)
                        {
                            _23512 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker3], g_bindless_Sampler[_Globals_.g_sAnisoClampV]), _20629, -1.0).xyz;
                        }
                        else
                        {
                            _23512 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), _20629, -1.0).xyz;
                        }
                        vec3 _25250 = mix(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker3], g_bindless_Sampler[_Globals_.g_sPoint]), _20629, 0.0).xyz, _23512, _20713);
                        vec3 _19484 = _25250.xyz;
                        float _7253 = dot(saturate(_19484 * _Globals_.g_flSfxColorBoostSticker3).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _19219 = normalize(max(vec3(0.0003000000142492353916168212890625), _19484)) * 1.059999942779541015625;
                        vec3 _13614 = _19219.xyz;
                        vec3 _19124 = max((((_13614 * _Globals_.g_vHoloAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13614))) / vec3(dot(_19219.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19219 * mix(_Globals_.g_vHoloAlbedoLevels.x, _Globals_.g_vHoloAlbedoLevels.z, saturate(pow(max(_25250.x, max(_25250.y, _25250.z)) * _Globals_.g_flSfxColorBoostSticker3, _Globals_.g_vHoloAlbedoLevels.y)))).xyz;
                        vec3 _25197 = mix(_12919.xyz, mix(vec3(_Globals_.g_vHoloAlbedoLevels.x), mix(_19124, min(_Globals_.g_vHoloAlbedoLevels.zzz, _19124 + (vec3(_7253) * _Globals_.g_flSfxColorBoostSticker3)), vec3(max(0.0, _Globals_.g_flSfxColorBoostSticker3 - 1.0) / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vHoloAlbedoLevels.x, _7253), 0.5))), vec3(_20595));
                        vec4 _17877 = _12919;
                        _17877.x = _25197.x;
                        _17877.y = _25197.y;
                        _17877.z = _25197.z;
                        _13215 = _16866 * (1.0 - _20595);
                        _15677 = _17877;
                    }
                    else
                    {
                        _13215 = _16866;
                        _15677 = _12919;
                    }
                    _12042 = _13215;
                    _7483 = _15677;
                }
                else
                {
                    _12042 = _16866;
                    _7483 = _12919;
                }
                float _13186;
                float _14142;
                vec4 _14627;
                if (_Globals_.g_flSticker3Wear > 0.0)
                {
                    vec4 _18152 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tStickerScratches], g_bindless_Sampler[_Globals_.g_sAniso]), _11096, -1.0);
                    float _12597 = 1.0 - min(_Globals_.g_fWearScratchesSticker3, _18152.x);
                    float _12771 = mix(_12597, _12597 * 0.5, _Globals_.g_flSticker3Wear);
                    float _16216 = saturate(mix(_Globals_.g_flSticker3Wear, _Globals_.g_flSticker3Wear + ((2.0 * (_21367.y - 0.5)) * smoothstep(1.0, 0.85000002384185791015625, _Globals_.g_flSticker3Wear)), _Globals_.g_flSticker3Wear));
                    float _20318;
                    if (!_23733)
                    {
                        _20318 = ((_Globals_.g_vWearBiasSticker3.y * ((_Globals_.g_vWearBiasSticker3.y > 0.0) ? 0.5 : 0.25)) + 0.5) * 0.5;
                    }
                    else
                    {
                        _20318 = 0.5;
                    }
                    float _8284 = saturate(_16216 - pow(saturate((_7434 - 0.078431375324726104736328125) * 1.085106372833251953125), _Globals_.g_vWearBiasSticker3.x * _Globals_.g_vWearBiasSticker3.x));
                    vec4 _12047;
                    if (_23733)
                    {
                        float _12208 = saturate(_8284 * 2.0) + (_Globals_.g_vWearBiasSticker3.y * _16216);
                        vec3 _25198 = mix(vec3(mix(0.699999988079071044921875, 0.20000000298023223876953125 + (0.4000000059604644775390625 * _12771), _16216)), _7483.xyz, vec3(smoothstep(_12208, _12208 + 0.100000001490116119384765625, _12771)));
                        vec4 _17878 = _7483;
                        _17878.x = _25198.x;
                        _17878.y = _25198.y;
                        _17878.z = _25198.z;
                        _12047 = _17878;
                    }
                    else
                    {
                        _12047 = _7483;
                    }
                    float _18656 = saturate((_8284 * (1.0 + _20318)) - _20318);
                    float _12516;
                    if (_23731 ? true : (_Globals_.g_bPreserveRoughnessSticker3 != 0))
                    {
                        _12516 = _10567;
                    }
                    else
                    {
                        _12516 = mix(_10567, 0.800000011920928955078125, step(_12771, smoothstep(0.0, 0.3499999940395355224609375, _16216)));
                    }
                    _13186 = _16216;
                    _14142 = _12516;
                    _14627 = vec4(mix(_12047.xyz, _12047.xyz * _12771, vec3(_16216 * 0.300000011920928955078125)), _12047.w * smoothstep(_18656, _18656 + 0.100000001490116119384765625, _12771));
                }
                else
                {
                    _13186 = _Globals_.g_flSticker3Wear;
                    _14142 = _10567;
                    _14627 = _7483;
                }
                vec2 _7743 = mix(_11096 - vec2(0.5), _16346.xy, vec2(_14627.w));
                vec3 _17879 = _16346;
                _17879.x = _7743.x;
                _17879.y = _7743.y;
                vec4 _6627;
                float _13190;
                float _13701;
                float _16331;
                float _17238;
                vec3 _17239;
                if (_23040)
                {
                    float _10424 = saturate(_19308 * 1.111111164093017578125);
                    float _23774 = saturate(_19308 * 2.22222232818603515625);
                    float _9524 = pow(_23774, 0.5);
                    float _25026 = _9993.y;
                    float _10077 = _9524 - _25026;
                    float _6989 = abs(_10077);
                    float _13189;
                    float _16330;
                    vec4 _16529;
                    float _17235;
                    vec3 _17236;
                    float _17237;
                    if (_25026 > _9524)
                    {
                        _13189 = _16224;
                        _16330 = _14142;
                        _17235 = _12042;
                        _17236 = _17879;
                        _17237 = _24311;
                        _16529 = vec4(0.0, 0.0, 0.0, _14627.w * (1.0 - pow(_6989, 0.20000000298023223876953125)));
                    }
                    else
                    {
                        float _9904 = mix(1.0, (_10077 + _9524) + (_6989 * 0.300000011920928955078125), pow(_25026, 0.20000000298023223876953125));
                        vec2 _16976 = _9993;
                        _16976.y = _9904;
                        vec4 _10454;
                        float _12738;
                        float _13187;
                        float _16329;
                        float _17233;
                        vec3 _17234;
                        if (_9904 < 1.0)
                        {
                            vec4 _20994 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker3], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(_16976).xy, -1.0);
                            float _12478 = dot(_20994.xyz, vec3(0.2989999949932098388671875, 0.58700001239776611328125, 0.114000000059604644775390625));
                            vec4 _19623;
                            _19623.x = _12478;
                            _19623.y = _12478;
                            _19623.z = _12478;
                            float _16960 = saturate(_20994.w * 12.75);
                            float _18228 = mix(pow(_6989, 0.100000001490116119384765625), 1.0, _23774);
                            vec3 _10991 = vec3(_16960);
                            _13187 = mix(_16224, _18228, _16960);
                            _16329 = mix(_14142, 0.800000011920928955078125, _16960);
                            _17233 = mix(_12042, 0.0, _16960);
                            _17234 = mix(_17879, vec3(0.0, 0.0, 1.0), _10991);
                            _12738 = mix(_24311, 1.0, _16960);
                            _10454 = vec4(mix(_14627.xyz * _18228, vec4(mix(_19623.xyz, vec3(0.300000011920928955078125), vec3(0.800000011920928955078125)) * pow(_6989, 0.20000000298023223876953125), _16960).xyz, _10991), max(_14627.w, _16960));
                        }
                        else
                        {
                            _13187 = _16224;
                            _16329 = _14142;
                            _17233 = _12042;
                            _17234 = _17879;
                            _12738 = _24311;
                            _10454 = _14627;
                        }
                        vec3 _14962 = mix(_10454.xyz, _10454.xyz * 10.0, vec3(step(0.5, _10424) * pow(smoothstep(1.0, 0.5, _10424), 20.0)));
                        vec4 _17880 = _10454;
                        _17880.x = _14962.x;
                        _17880.y = _14962.y;
                        _17880.z = _14962.z;
                        _13189 = _13187;
                        _16330 = _16329;
                        _17235 = _17233;
                        _17236 = _17234;
                        _17237 = _12738;
                        _16529 = _17880;
                    }
                    _13190 = _13189;
                    _16331 = _16330;
                    _17238 = _17235;
                    _17239 = _17236;
                    _13701 = _17237;
                    _6627 = _16529;
                }
                else
                {
                    _13190 = _16224;
                    _16331 = _14142;
                    _17238 = _12042;
                    _17239 = _17879;
                    _13701 = _24311;
                    _6627 = _14627;
                }
                float _10164 = PerViewConstantBuffer_t._m0 - _Globals_.g_flHighlightTimeSticker3;
                vec4 _20319;
                if (_10164 < 2.0)
                {
                    vec3 _22960 = mix(_6627.xyz, _6627.xyz + vec3(1.0), vec3(pow(1.0 - (_10164 * 0.5), 5.0)));
                    vec4 _17881 = _6627;
                    _17881.x = _22960.x;
                    _17881.y = _22960.y;
                    _17881.z = _22960.z;
                    _20319 = _17881;
                }
                else
                {
                    _20319 = _6627;
                }
                float _12772 = _13701 * _20319.w;
                vec4 _11410;
                vec3 _13191;
                float _15654;
                float _16332;
                float _17240;
                vec3 _17241;
                if (_10240)
                {
                    vec4 _21714;
                    if (_Globals_.g_bActiveStickerMouseOver != 0)
                    {
                        vec3 _8832 = _20319.xyz * 2.0;
                        vec4 _8683 = _20319;
                        _8683.x = _8832.x;
                        _8683.y = _8832.y;
                        _8683.z = _8832.z;
                        _21714 = _8683;
                    }
                    else
                    {
                        _21714 = _20319;
                    }
                    bool _14886 = _Globals_.g_bActiveStickerMoving != 0;
                    float _10005;
                    vec4 _24353;
                    if (_14886)
                    {
                        vec2 _10165 = _11096 * 8.0;
                        vec3 _20337 = vec3(0.20000000298023223876953125) + saturate(vec3(dot(_21714.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) * 0.60000002384185791015625);
                        vec4 _20508 = _21714;
                        _20508.x = _20337.x;
                        _20508.y = _20337.y;
                        _20508.z = _20337.z;
                        vec3 _20320 = _20508.xyz + vec3(fract((floor(_10165.x) + floor(_10165.y)) * 0.5) * 0.20020000636577606201171875);
                        vec4 _20513 = _20508;
                        _20513.x = _20320.x;
                        _20513.y = _20320.y;
                        _20513.z = _20320.z;
                        vec3 _22871 = _20513.xyz * _17227;
                        vec4 _8684 = _20513;
                        _8684.x = _22871.x;
                        _8684.y = _22871.y;
                        _8684.z = _22871.z;
                        _10005 = _12772 * 0.89999997615814208984375;
                        _24353 = _8684;
                    }
                    else
                    {
                        _10005 = _12772;
                        _24353 = _21714;
                    }
                    bvec3 _14015 = bvec3(_14886);
                    _13191 = mix(_13185, vec3(0.0), _14015);
                    _16332 = _14886 ? 0.800000011920928955078125 : _16331;
                    _17240 = _14886 ? 0.0 : _17238;
                    _17241 = mix(_17239, vec3(0.0, 0.0, 1.0), _14015);
                    _15654 = _10005;
                    _11410 = _24353;
                }
                else
                {
                    _13191 = _13185;
                    _16332 = _16331;
                    _17240 = _17238;
                    _17241 = _17239;
                    _15654 = _12772;
                    _11410 = _20319;
                }
                float _13192;
                vec3 _16333;
                vec3 _16530;
                float _17242;
                float _17243;
                vec2 _17244;
                float _17245;
                vec3 _17250;
                vec3 _17251;
                float _17252;
                vec4 _17253;
                if (!(_22791 ? true : _12916))
                {
                    vec3 _23352 = vec3(_15654);
                    vec4 _24457;
                    _24457.x = max(_13700.x, _15654);
                    _24457.w = max(_13700.w, _15654 * (1.0 - _13186));
                    _13192 = _17765 ? _15654 : _19505;
                    _16333 = mix(_16328, _12920, _23352);
                    _17242 = mix(_17218, 0.0, _15654);
                    _17243 = mix(_17219, 0.039999999105930328369140625, _15654);
                    _17244 = mix(_17223.xy, vec2(_16332), vec2(_15654));
                    _17245 = mix(_17224, _17240, _15654);
                    _17250 = normalize(mix(_17225.xyz, _17241, _23352));
                    _17251 = mix(_17226.xyz, saturate(_11410.xyz), _23352);
                    _17252 = mix(_17227, _13190, _11410.w);
                    _17253 = _24457;
                    _16530 = mix(_6625.xyz, _13191, _23352);
                }
                else
                {
                    _13192 = _19505;
                    _16333 = _16328;
                    _17242 = _17218;
                    _17243 = _17219;
                    _17244 = _17223;
                    _17245 = _17224;
                    _17250 = _17225;
                    _17251 = _17226;
                    _17252 = _17227;
                    _17253 = _13700;
                    _16530 = _6625;
                }
                _13193 = _13192;
                _16334 = _16333;
                _17254 = _17242;
                _17255 = _17243;
                _17256 = _17244;
                _17257 = _17245;
                _17258 = _17250;
                _17259 = _17251;
                _17260 = _17252;
                _17261 = _17253;
                _16531 = _16530;
                break;
            } while(false);
            _13194 = _13193;
            _16339 = _16334;
            _17262 = _17254;
            _17263 = _17255;
            _17264 = _17256;
            _17265 = _17257;
            _17266 = _17258;
            _17267 = _17259;
            _17268 = _17260;
            _13703 = _17261;
            _6628 = _16531;
        }
        else
        {
            _13194 = _13174;
            _16339 = _16328;
            _17262 = _17218;
            _17263 = _17219;
            _17264 = _17223;
            _17265 = _17224;
            _17266 = _17225;
            _17267 = _17226;
            _17268 = _17227;
            _13703 = _13700;
            _6628 = _6625;
        }
        bool _12921;
        if (_Globals_.g_bEnableSticker4 != 0)
        {
            _12921 = true;
        }
        else
        {
            _12921 = _Globals_.g_bStickerPreviewForceOn != 0;
        }
        vec4 _13218;
        vec3 _16352;
        vec3 _16609;
        vec2 _17331;
        float _17332;
        vec3 _17333;
        float _17334;
        float _17340;
        vec3 _17341;
        float _17342;
        float _17343;
        if (_12921)
        {
            float _10830 = _Globals_.g_flGlitterScaleSticker4 * (notEqual(PerViewConstantBufferCsgo_t._m2, ivec4(0)).x ? 2.5 : 1.75);
            bool _23739 = _Globals_.g_bAutomaticPBRColorFittingSticker4 != 0;
            bool _23740 = _Globals_.g_bLegacyTintMultiplySticker4 != 0;
            bool _23741 = _Globals_.g_bMetallicSticker4 != 0;
            bool _23743 = _Globals_.g_bPaperBackingSticker4 != 0;
            vec4 _13217;
            vec3 _16351;
            vec3 _16608;
            vec2 _17323;
            float _17324;
            vec3 _17325;
            float _17326;
            float _17327;
            vec3 _17328;
            float _17329;
            float _17330;
            do
            {
                bool _17766 = _24464.y;
                float _19506 = _17766 ? 0.0 : _13194;
                bool _12922;
                if (_Globals_.g_vSticker4Scale.x == 0.0)
                {
                    _12922 = true;
                }
                else
                {
                    _12922 = _Globals_.g_vSticker4Scale.y == 0.0;
                }
                bool _12923;
                if (_12922)
                {
                    _12923 = true;
                }
                else
                {
                    _12923 = _19148 == 0.0;
                }
                if (_12923)
                {
                    _13217 = _13703;
                    _16351 = _6628;
                    _17323 = _17264;
                    _17324 = _17268;
                    _17325 = _16339;
                    _17326 = _19506;
                    _17327 = _17262;
                    _17328 = _17267;
                    _17329 = _17265;
                    _17330 = _17263;
                    _16608 = _17266;
                    break;
                }
                bool _10242 = 5 == _Globals_.g_nActiveStickerApplySlot;
                vec2 _17356 = ((_23261.zw - vec2(0.5)) - _Globals_.g_vSticker4Offset) * abs(_Globals_.g_vSticker4Scale).x;
                float _10693 = _Globals_.g_flSticker4Rotation * 6.28318023681640625;
                float _17508 = _17356.x;
                float _13197 = cos(_10693);
                float _22694 = _17356.y;
                float _20200 = sin(_10693);
                vec2 _15803 = vec2((_17508 * _13197) - (_22694 * _20200), (_17508 * _20200) + (_22694 * _13197)) + vec2(0.5);
                float _10372 = _15803.x;
                bool _12924;
                if (saturate(_10372) != _10372)
                {
                    _12924 = true;
                }
                else
                {
                    float _11833 = _15803.y;
                    _12924 = saturate(_11833) != _11833;
                }
                bool _12925;
                if (_10242)
                {
                    _12925 = _Globals_.g_bActiveStickerMoving == 0;
                }
                else
                {
                    _12925 = false;
                }
                float _19309;
                if (_12925)
                {
                    _19309 = PerViewConstantBuffer_t._m0 - _Globals_.g_bActiveStickerPeelStartTime;
                }
                else
                {
                    _19309 = 0.89999997615814208984375;
                }
                bool _23041 = _19309 < 0.89999997615814208984375;
                vec2 _9998 = saturate(_15803);
                vec2 _11099 = _9998.xy;
                vec4 _20338 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), _11099, -1.0);
                float _7437 = _20338.w;
                float _8484 = saturate(_7437 * 12.75) * _19148;
                vec4 _22300 = _20338;
                _22300.w = _8484;
                uvec2 _10922 = uvec2(textureSize(g_bindless_Texture2D_float4[_Globals_.g_tSticker4], 0));
                vec2 _14463 = vec2(1.0 / float(_10922.x), 1.0 / float(_10922.y));
                vec2 _6349 = textureQueryLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), clamp(_11099, _14463, vec2(1.0) - _14463));
                float _13006 = _6349.x;
                float _8804 = 1.0 - saturate(_13006 - 3.0);
                bool _18607 = _8804 > 0.0;
                vec4 _23185;
                if (_18607)
                {
                    float _15254 = dot(cross(PerViewConstantBuffer_t._m9, PerViewConstantBuffer_t._m8), -_7054);
                    float _24065 = dot(PerViewConstantBuffer_t._m8, _7054);
                    vec4 _17339 = _22300;
                    _17339.w = mix(_8484, max(_8484, (saturate(texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(((_9998 - vec2(0.5)) - (vec2((_15254 * _13197) - (_24065 * _20200), (_15254 * _20200) + (_24065 * _13197)) * 0.00999999977648258209228515625)) + vec2(0.5)).xy, 1.0).w * 12.75) * _19148) * 0.699999988079071044921875), _8804);
                    _23185 = _17339;
                }
                else
                {
                    _23185 = _22300;
                }
                float _24313 = _18607 ? _8484 : 1.0;
                bool _22792;
                if (_23185.w <= 0.0)
                {
                    _22792 = !_23041;
                }
                else
                {
                    _22792 = false;
                }
                vec4 _19381 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormalRoughnessSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), _11099, -1.0);
                float _16022 = _19381.x;
                float _19731 = _19381.y;
                float _16808 = (_16022 + _19731) - 1.00392162799835205078125;
                float _11209 = _16022 - _19731;
                vec3 _15736 = normalize(vec3(vec2(_16808, _11209), (1.0 - abs(_16808)) - abs(_11209)));
                _15736.y = -_15736.y;
                float _20019 = max(_13006, 3.0);
                vec4 _11210 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tNormal], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20019);
                float _15759 = _11210.x;
                float _17314 = _11210.y;
                float _16809 = (_15759 + _17314) - 1.00392162799835205078125;
                float _11211 = _15759 - _17314;
                vec3 _15738 = normalize(vec3(vec2(_16809, _11211), (1.0 - abs(_16809)) - abs(_11211)));
                _15738.y = -_15738.y;
                vec3 _10180 = normalize(_15738 + ((_15736 * _23185.w) * 2.0));
                float _16225 = min(pow(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tAmbientOcclusion], g_bindless_Sampler[_Globals_.g_sAniso]), _23261.xy, _20019).x, 0.75), (_24313 * 0.5) + 0.5);
                float _10568 = _19381.z;
                float _13794 = float(_23741);
                vec3 _13199;
                vec3 _16347;
                float _16867;
                if (_Globals_.g_bGlitterSticker4 != 0)
                {
                    vec4 _20339 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), _11099, -1.0);
                    float _16041 = 1.0 - _20339.w;
                    vec3 _13198;
                    vec3 _16385;
                    float _16589;
                    if (_16041 != 0.0)
                    {
                        vec3 _7193 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec4 _16753 = vec4(_9998 * _10830, (vec2(0.5) + _9998) * _10830);
                        vec2 _14123 = _16753.xy;
                        vec2 _12052 = dFdx(_14123);
                        vec2 _22198 = dFdy(_14123);
                        vec2 _8341 = max(_12052, _22198);
                        vec4 _19382 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker4], g_bindless_Sampler[_Globals_.g_sPoint]), _16753.xy);
                        float _16023 = _19382.x;
                        float _19732 = _19382.y;
                        float _16810 = (_16023 + _19732) - 1.00392162799835205078125;
                        float _11212 = _16023 - _19732;
                        vec3 _16024 = normalize(vec3(vec2(_16810, _11212), (1.0 - abs(_16810)) - abs(_11212)));
                        vec3 _22301 = _16024 * _16024.z;
                        vec3 _14759 = _24347.xyz;
                        vec3 _9155 = sin(reflect(_7193, normalize((((input_6.xyz * _22301.x).xyz + (_7424.xyz * _22301.y)).xyz + (_14759 * _22301.z)).xyz)) * 12.0);
                        vec3 _7407 = max(vec3(0.0), (_9155 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17271 = ((vec3(pow(dot(saturate(-_9155).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9155).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7407.xyz + pow(_7407.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _15621 = (0.039999999105930328369140625 * _16041) * saturate(1.0 - (min(_8341.x, _8341.y) * 40.0));
                        vec2 _24097 = _10180.xy + (_22301.xy * _15621);
                        vec3 _20515 = _10180;
                        _20515.x = _24097.x;
                        _20515.y = _24097.y;
                        vec4 _11213 = textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tGlitterNormalSticker4], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _16753.zw, 0.0);
                        float _15760 = _11213.x;
                        float _17316 = _11213.y;
                        float _16811 = (_15760 + _17316) - 1.00392162799835205078125;
                        float _11214 = _15760 - _17316;
                        vec3 _16025 = normalize(vec3(vec2(_16811, _11214), (1.0 - abs(_16811)) - abs(_11214)));
                        vec3 _9156 = sin(reflect(_7193, normalize((((input_6.xyz * _16025.x).xyz + (_7424.xyz * _16025.y)).xyz + (_14759 * _16025.z)).xyz)) * 12.0);
                        vec3 _7408 = max(vec3(0.0), (_9156 - vec3(0.9900000095367431640625)).xyz) * 100.00009918212890625;
                        vec3 _17272 = ((vec3(pow(dot(saturate(-_9156).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 4.0)) + vec3(dot(saturate(vec3(0.14999997615814208984375) - _9156).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) * 0.25)).xyz + (((_7408.xyz + pow(_7408.yzx, vec3(4.0))) * 4.0) * 0.75)).xyz;
                        float _23837 = _11213.w;
                        vec3 _9763;
                        if (_23739)
                        {
                            vec3 _19220 = normalize(max(vec3(0.0003000000142492353916168212890625), _23185.xyz)) * 1.059999942779541015625;
                            vec3 _13615 = _19220.xyz;
                            _9763 = mix(vec3(_Globals_.g_vAlbedoLevels.x), max((((_13615 * _Globals_.g_vAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13615))) / vec3(dot(_19220.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19220 * mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vAlbedoLevels.z, saturate(pow(max(_23185.x, max(_23185.y, _23185.z)), _Globals_.g_vAlbedoLevels.y)))).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vAlbedoLevels.x, dot(saturate(_23185.xyz * 1.0).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), 0.5))).xyz;
                        }
                        else
                        {
                            _9763 = _23185.xyz;
                        }
                        vec2 _13870 = _20515.xy + ((_16025.xy * _15621) * _23837);
                        vec3 _20516 = _20515;
                        _20516.x = _13870.x;
                        _20516.y = _13870.y;
                        _13198 = (max(((_17271 * 0.0500000007450580596923828125) + (_17271 * 0.949999988079071044921875)).xyz * _19382.w, ((_17272 * 0.0500000007450580596923828125) + (_17272 * 0.949999988079071044921875)).xyz * _23837) * (_9763 * _Globals_.g_flSfxColorBoostSticker4)).xyz * _16041;
                        _16385 = _20516;
                        _16589 = max(_13794, _16041 * 0.5);
                    }
                    else
                    {
                        _13198 = _6628.xyz;
                        _16385 = _10180;
                        _16589 = _13794;
                    }
                    _13199 = _13198;
                    _16347 = _16385;
                    _16867 = _16589;
                }
                else
                {
                    _13199 = _6628.xyz;
                    _16347 = _10180;
                    _16867 = _13794;
                }
                vec4 _12927;
                if (_23739)
                {
                    vec3 _24160 = vec3(_16867);
                    vec3 _13751 = mix(vec3(1.0), _Globals_.g_vColorTintSticker4.xyz, _24160);
                    float _11986 = mix(0.0, _Globals_.g_flTintSaturateSticker4, _16867);
                    vec4 _12518;
                    if (_23740)
                    {
                        vec3 _22775 = mix(_23185.xyz, vec3(dot(_23185.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_11986));
                        vec4 _17884 = _23185;
                        _17884.x = _22775.x;
                        _17884.y = _22775.y;
                        _17884.z = _22775.z;
                        vec3 _16593 = saturate(_17884.xyz * _13751);
                        float _15338 = _16593.x;
                        vec4 _13533 = _17884;
                        _13533.x = _15338;
                        float _21864 = _16593.y;
                        _13533.y = _21864;
                        float _21809 = _16593.z;
                        _13533.z = _21809;
                        vec3 _24053 = normalize(max(vec3(0.0003000000142492353916168212890625), _13533.xyz)) * 1.059999942779541015625;
                        float _6679 = dot(saturate(_13533.xyz * _Globals_.g_flColorBoostSticker4).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12776 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6679))), _24160);
                        float _20089 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16867);
                        vec3 _22785 = _24053.xyz;
                        vec3 _19126 = max((((_22785 * _20089) * 1.73199999332427978515625) / vec3(length(_22785))) / vec3(dot(_24053.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _24053 * mix(_12776.x, _12776.z, saturate(pow(max(_15338, max(_21864, _21809)) * _Globals_.g_flColorBoostSticker4, _12776.y)))).xyz;
                        vec3 _22945 = mix(vec3(_20089), mix(_19126, min(_12776.zzz, _19126 + vec3(_6679)), vec3(max(0.0, _Globals_.g_flColorBoostSticker4 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20089, _6679), 0.5)));
                        vec4 _13901 = _13533;
                        _13901.x = _22945.x;
                        _13901.y = _22945.y;
                        _13901.z = _22945.z;
                        _12518 = _13901;
                    }
                    else
                    {
                        vec3 _18077 = _13751.xyz;
                        vec3 _10736 = normalize(max(vec3(0.0003000000142492353916168212890625), mix(_18077 * _23185.xyz, _18077, vec3(_11986)).xyz)) * 1.059999942779541015625;
                        float _6678 = dot(saturate(_23185.xyz * _Globals_.g_flColorBoostSticker4).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _12775 = mix(_Globals_.g_vAlbedoLevels, mix(_Globals_.g_vMetallicAlbedoLevels, _Globals_.g_vDarkMetallicAlbedoLevels, vec3(smoothstep(0.550000011920928955078125, 0.0155999995768070220947265625, _6678))), _24160);
                        float _20088 = mix(_Globals_.g_vAlbedoLevels.x, _Globals_.g_vDarkMetallicAlbedoLevels.x, _16867);
                        vec3 _22784 = _10736.xyz;
                        vec3 _19125 = max((((_22784 * _20088) * 1.73199999332427978515625) / vec3(length(_22784))) / vec3(dot(_10736.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _10736 * mix(_12775.x, _12775.z, saturate(pow(max(_23185.x, max(_23185.y, _23185.z)) * _Globals_.g_flColorBoostSticker4, _12775.y)))).xyz;
                        vec3 _22944 = mix(vec3(_20088), mix(_19125, min(_12775.zzz, _19125 + vec3(_6678)), vec3(max(0.0, _Globals_.g_flColorBoostSticker4 - 1.0) * 0.01587301678955554962158203125)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _20088, _6678), 0.5)));
                        vec4 _13900 = _23185;
                        _13900.x = _22944.x;
                        _13900.y = _22944.y;
                        _13900.z = _22944.z;
                        _12518 = _13900;
                    }
                    _12927 = _12518;
                }
                else
                {
                    vec4 _12517;
                    if (_23741)
                    {
                        vec3 _20064 = mix(_23185.xyz, vec3(dot(_23185.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), vec3(_Globals_.g_flTintSaturateSticker4)) * _Globals_.g_vColorTintSticker4.xyz;
                        vec4 _23748 = _23185;
                        _23748.x = _20064.x;
                        _23748.y = _20064.y;
                        _23748.z = _20064.z;
                        vec3 _24691 = _23748.xyz * (_23740 ? _Globals_.g_flColorBoostSticker4 : 1.0);
                        vec4 _8685 = _23748;
                        _8685.x = _24691.x;
                        _8685.y = _24691.y;
                        _8685.z = _24691.z;
                        _12517 = _8685;
                    }
                    else
                    {
                        _12517 = _23185;
                    }
                    _12927 = _12517;
                }
                vec3 _12928;
                if (_Globals_.g_bSelfIllumSticker4 != 0)
                {
                    _12928 = (_12927.xyz * _19381.w) * 2.0;
                }
                else
                {
                    _12928 = vec3(0.0);
                }
                vec4 _7488;
                float _12058;
                if (_Globals_.g_bHolographicSticker4 != 0)
                {
                    vec4 _19342 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker4], g_bindless_Sampler[_Globals_.g_sPoint]), _11099, -1.0);
                    vec4 _19733 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSfxMaskSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), _11099, -1.0);
                    vec3 _20719 = vec3(_19342.w);
                    vec3 _7719 = mix(_19342.xyz, _19733.xyz, _20719);
                    float _20601 = _7719.x;
                    float _13216;
                    vec4 _15679;
                    if (_20601 > 0.0)
                    {
                        vec3 _24044 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
                        vec2 _20630 = vec2(_7719.y + (dot(_24044, _24347) + dot(_24044, PerViewLightingConstantBufferGpu_t._m16.xyz)), _7719.z);
                        vec3 _23513;
                        SPIRV_CROSS_BRANCH
                        if (_Globals_.g_bClampSpectrumVSticker4 != 0)
                        {
                            _23513 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker4], g_bindless_Sampler[_Globals_.g_sAnisoClampV]), _20630, -1.0).xyz;
                        }
                        else
                        {
                            _23513 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), _20630, -1.0).xyz;
                        }
                        vec3 _25251 = mix(textureLod(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tHoloSpectrumSticker4], g_bindless_Sampler[_Globals_.g_sPoint]), _20630, 0.0).xyz, _23513, _20719);
                        vec3 _19488 = _25251.xyz;
                        float _7256 = dot(saturate(_19488 * _Globals_.g_flSfxColorBoostSticker4).xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
                        vec3 _19221 = normalize(max(vec3(0.0003000000142492353916168212890625), _19488)) * 1.059999942779541015625;
                        vec3 _13616 = _19221.xyz;
                        vec3 _19132 = max((((_13616 * _Globals_.g_vHoloAlbedoLevels.x) * 1.73199999332427978515625) / vec3(length(_13616))) / vec3(dot(_19221.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))), _19221 * mix(_Globals_.g_vHoloAlbedoLevels.x, _Globals_.g_vHoloAlbedoLevels.z, saturate(pow(max(_25251.x, max(_25251.y, _25251.z)) * _Globals_.g_flSfxColorBoostSticker4, _Globals_.g_vHoloAlbedoLevels.y)))).xyz;
                        vec3 _25199 = mix(_12927.xyz, mix(vec3(_Globals_.g_vHoloAlbedoLevels.x), mix(_19132, min(_Globals_.g_vHoloAlbedoLevels.zzz, _19132 + (vec3(_7256) * _Globals_.g_flSfxColorBoostSticker4)), vec3(max(0.0, _Globals_.g_flSfxColorBoostSticker4 - 1.0) / _Globals_.g_fColorBoostFactor)).xyz, vec3(pow(smoothstep(0.0003000000142492353916168212890625, _Globals_.g_vHoloAlbedoLevels.x, _7256), 0.5))), vec3(_20601));
                        vec4 _17887 = _12927;
                        _17887.x = _25199.x;
                        _17887.y = _25199.y;
                        _17887.z = _25199.z;
                        _13216 = _16867 * (1.0 - _20601);
                        _15679 = _17887;
                    }
                    else
                    {
                        _13216 = _16867;
                        _15679 = _12927;
                    }
                    _12058 = _13216;
                    _7488 = _15679;
                }
                else
                {
                    _12058 = _16867;
                    _7488 = _12927;
                }
                float _13200;
                float _14143;
                vec4 _14634;
                if (_Globals_.g_flSticker4Wear > 0.0)
                {
                    vec4 _18173 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tStickerScratches], g_bindless_Sampler[_Globals_.g_sAniso]), _11099, -1.0);
                    float _12598 = 1.0 - min(_Globals_.g_fWearScratchesSticker4, _18173.x);
                    float _12778 = mix(_12598, _12598 * 0.5, _Globals_.g_flSticker4Wear);
                    float _16219 = saturate(mix(_Globals_.g_flSticker4Wear, _Globals_.g_flSticker4Wear + ((2.0 * (_21367.y - 0.5)) * smoothstep(1.0, 0.85000002384185791015625, _Globals_.g_flSticker4Wear)), _Globals_.g_flSticker4Wear));
                    float _20321;
                    if (!_23743)
                    {
                        _20321 = ((_Globals_.g_vWearBiasSticker4.y * ((_Globals_.g_vWearBiasSticker4.y > 0.0) ? 0.5 : 0.25)) + 0.5) * 0.5;
                    }
                    else
                    {
                        _20321 = 0.5;
                    }
                    float _8285 = saturate(_16219 - pow(saturate((_7437 - 0.078431375324726104736328125) * 1.085106372833251953125), _Globals_.g_vWearBiasSticker4.x * _Globals_.g_vWearBiasSticker4.x));
                    vec4 _12059;
                    if (_23743)
                    {
                        float _12209 = saturate(_8285 * 2.0) + (_Globals_.g_vWearBiasSticker4.y * _16219);
                        vec3 _25200 = mix(vec3(mix(0.699999988079071044921875, 0.20000000298023223876953125 + (0.4000000059604644775390625 * _12778), _16219)), _7488.xyz, vec3(smoothstep(_12209, _12209 + 0.100000001490116119384765625, _12778)));
                        vec4 _17888 = _7488;
                        _17888.x = _25200.x;
                        _17888.y = _25200.y;
                        _17888.z = _25200.z;
                        _12059 = _17888;
                    }
                    else
                    {
                        _12059 = _7488;
                    }
                    float _18657 = saturate((_8285 * (1.0 + _20321)) - _20321);
                    float _12520;
                    if (_23741 ? true : (_Globals_.g_bPreserveRoughnessSticker4 != 0))
                    {
                        _12520 = _10568;
                    }
                    else
                    {
                        _12520 = mix(_10568, 0.800000011920928955078125, step(_12778, smoothstep(0.0, 0.3499999940395355224609375, _16219)));
                    }
                    _13200 = _16219;
                    _14143 = _12520;
                    _14634 = vec4(mix(_12059.xyz, _12059.xyz * _12778, vec3(_16219 * 0.300000011920928955078125)), _12059.w * smoothstep(_18657, _18657 + 0.100000001490116119384765625, _12778));
                }
                else
                {
                    _13200 = _Globals_.g_flSticker4Wear;
                    _14143 = _10568;
                    _14634 = _7488;
                }
                vec2 _7748 = mix(_11099 - vec2(0.5), _16347.xy, vec2(_14634.w));
                vec3 _17889 = _16347;
                _17889.x = _7748.x;
                _17889.y = _7748.y;
                vec4 _6630;
                float _13204;
                float _13704;
                float _16342;
                float _17280;
                vec3 _17292;
                if (_23041)
                {
                    float _10425 = saturate(_19309 * 1.111111164093017578125);
                    float _23776 = saturate(_19309 * 2.22222232818603515625);
                    float _9526 = pow(_23776, 0.5);
                    float _25032 = _9998.y;
                    float _10078 = _9526 - _25032;
                    float _6996 = abs(_10078);
                    float _13203;
                    float _16341;
                    vec4 _16606;
                    float _17277;
                    vec3 _17278;
                    float _17279;
                    if (_25032 > _9526)
                    {
                        _13203 = _16225;
                        _16341 = _14143;
                        _17277 = _12058;
                        _17278 = _17889;
                        _17279 = _24313;
                        _16606 = vec4(0.0, 0.0, 0.0, _14634.w * (1.0 - pow(_6996, 0.20000000298023223876953125)));
                    }
                    else
                    {
                        float _9909 = mix(1.0, (_10078 + _9526) + (_6996 * 0.300000011920928955078125), pow(_25032, 0.20000000298023223876953125));
                        vec2 _16977 = _9998;
                        _16977.y = _9909;
                        vec4 _10455;
                        float _12739;
                        float _13201;
                        float _16340;
                        float _17275;
                        vec3 _17276;
                        if (_9909 < 1.0)
                        {
                            vec4 _20995 = texture(sampler2D(g_bindless_Texture2D_float4[_Globals_.g_tSticker4], g_bindless_Sampler[_Globals_.g_sAniso]), saturate(_16977).xy, -1.0);
                            float _12479 = dot(_20995.xyz, vec3(0.2989999949932098388671875, 0.58700001239776611328125, 0.114000000059604644775390625));
                            vec4 _19624;
                            _19624.x = _12479;
                            _19624.y = _12479;
                            _19624.z = _12479;
                            float _16961 = saturate(_20995.w * 12.75);
                            float _18229 = mix(pow(_6996, 0.100000001490116119384765625), 1.0, _23776);
                            vec3 _10999 = vec3(_16961);
                            _13201 = mix(_16225, _18229, _16961);
                            _16340 = mix(_14143, 0.800000011920928955078125, _16961);
                            _17275 = mix(_12058, 0.0, _16961);
                            _17276 = mix(_17889, vec3(0.0, 0.0, 1.0), _10999);
                            _12739 = mix(_24313, 1.0, _16961);
                            _10455 = vec4(mix(_14634.xyz * _18229, vec4(mix(_19624.xyz, vec3(0.300000011920928955078125), vec3(0.800000011920928955078125)) * pow(_6996, 0.20000000298023223876953125), _16961).xyz, _10999), max(_14634.w, _16961));
                        }
                        else
                        {
                            _13201 = _16225;
                            _16340 = _14143;
                            _17275 = _12058;
                            _17276 = _17889;
                            _12739 = _24313;
                            _10455 = _14634;
                        }
                        vec3 _14963 = mix(_10455.xyz, _10455.xyz * 10.0, vec3(step(0.5, _10425) * pow(smoothstep(1.0, 0.5, _10425), 20.0)));
                        vec4 _17890 = _10455;
                        _17890.x = _14963.x;
                        _17890.y = _14963.y;
                        _17890.z = _14963.z;
                        _13203 = _13201;
                        _16341 = _16340;
                        _17277 = _17275;
                        _17278 = _17276;
                        _17279 = _12739;
                        _16606 = _17890;
                    }
                    _13204 = _13203;
                    _16342 = _16341;
                    _17280 = _17277;
                    _17292 = _17278;
                    _13704 = _17279;
                    _6630 = _16606;
                }
                else
                {
                    _13204 = _16225;
                    _16342 = _14143;
                    _17280 = _12058;
                    _17292 = _17889;
                    _13704 = _24313;
                    _6630 = _14634;
                }
                float _10167 = PerViewConstantBuffer_t._m0 - _Globals_.g_flHighlightTimeSticker4;
                vec4 _20341;
                if (_10167 < 2.0)
                {
                    vec3 _22962 = mix(_6630.xyz, _6630.xyz + vec3(1.0), vec3(pow(1.0 - (_10167 * 0.5), 5.0)));
                    vec4 _17891 = _6630;
                    _17891.x = _22962.x;
                    _17891.y = _22962.y;
                    _17891.z = _22962.z;
                    _20341 = _17891;
                }
                else
                {
                    _20341 = _6630;
                }
                float _12779 = _13704 * _20341.w;
                vec4 _11412;
                vec3 _13205;
                float _15655;
                float _16349;
                float _17293;
                vec3 _17294;
                if (_10242)
                {
                    vec4 _21715;
                    if (_Globals_.g_bActiveStickerMouseOver != 0)
                    {
                        vec3 _8834 = _20341.xyz * 2.0;
                        vec4 _8686 = _20341;
                        _8686.x = _8834.x;
                        _8686.y = _8834.y;
                        _8686.z = _8834.z;
                        _21715 = _8686;
                    }
                    else
                    {
                        _21715 = _20341;
                    }
                    bool _14889 = _Globals_.g_bActiveStickerMoving != 0;
                    float _10009;
                    vec4 _24358;
                    if (_14889)
                    {
                        vec2 _10168 = _11099 * 8.0;
                        vec3 _20342 = vec3(0.20000000298023223876953125) + saturate(vec3(dot(_21715.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) * 0.60000002384185791015625);
                        vec4 _20519 = _21715;
                        _20519.x = _20342.x;
                        _20519.y = _20342.y;
                        _20519.z = _20342.z;
                        vec3 _20343 = _20519.xyz + vec3(fract((floor(_10168.x) + floor(_10168.y)) * 0.5) * 0.20020000636577606201171875);
                        vec4 _20520 = _20519;
                        _20520.x = _20343.x;
                        _20520.y = _20343.y;
                        _20520.z = _20343.z;
                        vec3 _22874 = _20520.xyz * _17268;
                        vec4 _8696 = _20520;
                        _8696.x = _22874.x;
                        _8696.y = _22874.y;
                        _8696.z = _22874.z;
                        _10009 = _12779 * 0.89999997615814208984375;
                        _24358 = _8696;
                    }
                    else
                    {
                        _10009 = _12779;
                        _24358 = _21715;
                    }
                    bvec3 _14027 = bvec3(_14889);
                    _13205 = mix(_13199, vec3(0.0), _14027);
                    _16349 = _14889 ? 0.800000011920928955078125 : _16342;
                    _17293 = _14889 ? 0.0 : _17280;
                    _17294 = mix(_17292, vec3(0.0, 0.0, 1.0), _14027);
                    _15655 = _10009;
                    _11412 = _24358;
                }
                else
                {
                    _13205 = _13199;
                    _16349 = _16342;
                    _17293 = _17280;
                    _17294 = _17292;
                    _15655 = _12779;
                    _11412 = _20341;
                }
                vec4 _13206;
                vec3 _16350;
                vec3 _16607;
                vec2 _17295;
                float _17296;
                vec3 _17297;
                float _17318;
                float _17319;
                vec3 _17320;
                float _17321;
                float _17322;
                if (!(_22792 ? true : _12924))
                {
                    vec3 _23354 = vec3(_15655);
                    vec4 _24458;
                    _24458.x = max(_13703.x, _15655);
                    _24458.w = max(_13703.w, _15655 * (1.0 - _13200));
                    _13206 = _24458;
                    _16350 = mix(_6628.xyz, _13205, _23354);
                    _17295 = mix(_17264.xy, vec2(_16349), vec2(_15655));
                    _17296 = mix(_17268, _13204, _11412.w);
                    _17297 = mix(_16339, _12928, _23354);
                    _17318 = _17766 ? _15655 : _19506;
                    _17319 = mix(_17262, 0.0, _15655);
                    _17320 = mix(_17267.xyz, saturate(_11412.xyz), _23354);
                    _17321 = mix(_17265, _17293, _15655);
                    _17322 = mix(_17263, 0.039999999105930328369140625, _15655);
                    _16607 = normalize(mix(_17266.xyz, _17294, _23354));
                }
                else
                {
                    _13206 = _13703;
                    _16350 = _6628;
                    _17295 = _17264;
                    _17296 = _17268;
                    _17297 = _16339;
                    _17318 = _19506;
                    _17319 = _17262;
                    _17320 = _17267;
                    _17321 = _17265;
                    _17322 = _17263;
                    _16607 = _17266;
                }
                _13217 = _13206;
                _16351 = _16350;
                _17323 = _17295;
                _17324 = _17296;
                _17325 = _17297;
                _17326 = _17318;
                _17327 = _17319;
                _17328 = _17320;
                _17329 = _17321;
                _17330 = _17322;
                _16608 = _16607;
                break;
            } while(false);
            _13218 = _13217;
            _16352 = _16351;
            _17331 = _17323;
            _17332 = _17324;
            _17333 = _17325;
            _17334 = _17326;
            _17340 = _17327;
            _17341 = _17328;
            _17342 = _17329;
            _17343 = _17330;
            _16609 = _16608;
        }
        else
        {
            _13218 = _13703;
            _16352 = _6628;
            _17331 = _17264;
            _17332 = _17268;
            _17333 = _16339;
            _17334 = _13194;
            _17340 = _17262;
            _17341 = _17267;
            _17342 = _17265;
            _17343 = _17263;
            _16609 = _17266;
        }
        _13219 = _13218;
        _16353 = _16352;
        _17344 = _17331;
        _17345 = _17332;
        _17346 = _17333;
        _17347 = _17334;
        _17348 = _17340;
        _17349 = _17341;
        _17350 = _17342;
        _14001 = _17343;
        _24173 = _16609;
    }
    else
    {
        _13219 = vec4(0.0);
        _16353 = vec3(0.0);
        _17344 = _16306;
        _17345 = _17476;
        _17346 = vec3(0.0);
        _17347 = input_4.w;
        _17348 = _24590;
        _17349 = _21710;
        _17350 = _20079;
        _14001 = 0.0199999995529651641845703125;
        _24173 = _6616;
    }
    vec3 _7866 = _24173;
    _7866.y = -_24173.y;
    bool _12929;
    if (_14874)
    {
        _12929 = _Globals_.g_bDontFlipBackfaceNormals == 0;
    }
    else
    {
        _12929 = false;
    }
    bool _24328;
    if (_12929)
    {
        _24328 = !gl_FrontFacing;
    }
    else
    {
        _24328 = false;
    }
    vec3 _9739 = input_2.xyz * (_24328 ? (-1.0) : 1.0);
    vec3 _24682 = cross(_9739.xyz, input_6.xyz) * _23240;
    vec3 _7440;
    if (_20058)
    {
        _7440 = -_24682;
    }
    else
    {
        _7440 = _24682;
    }
    vec3 _20484;
    if (!_24328)
    {
        vec3 _23482 = _7866;
        _23482.y = _24173.y;
        _20484 = _23482;
    }
    else
    {
        _20484 = _7866;
    }
    vec3 _14797 = normalize((((input_6.xyz * _20484.x).xyz + (_7440.xyz * _20484.y)).xyz + (_9739.xyz * _20484.z)).xyz);
    vec3 _8489 = mix(vec3(_14001).xyz, _17349.xyz, vec3(_17350));
    vec3 _22671;
    SPIRV_CROSS_BRANCH
    if (_Globals_.bIridescence != 0)
    {
        vec3 _24103 = normalize(PerViewConstantBuffer_t._m7.xyz - _10061.xyz);
        float _22201 = fract(((dot(_24103, _24347) + dot(_24103, PerViewLightingConstantBufferGpu_t._m16.xyz)) * _Globals_.g_flIridescentScale) + _Globals_.g_flIridescentHueShift) * 6.0;
        float _17522 = floor(_22201);
        float _18832 = _22201 - _17522;
        float _6692 = 1.0 - _18832;
        vec3 _19666;
        if (_17522 == 0.0)
        {
            _19666 = vec3(1.0, _18832, 0.0);
        }
        else
        {
            vec3 _12524;
            if (_17522 == 1.0)
            {
                _12524 = vec3(_6692, 1.0, 0.0);
            }
            else
            {
                vec3 _12523;
                if (_17522 == 2.0)
                {
                    _12523 = vec3(0.0, 1.0, _18832);
                }
                else
                {
                    vec3 _12522;
                    if (_17522 == 3.0)
                    {
                        _12522 = vec3(0.0, _6692, 1.0);
                    }
                    else
                    {
                        vec3 _12521;
                        if (_17522 == 4.0)
                        {
                            _12521 = vec3(_18832, 0.0, 1.0);
                        }
                        else
                        {
                            _12521 = vec3(1.0, 0.0, _6692);
                        }
                        _12522 = _12521;
                    }
                    _12523 = _12522;
                }
                _12524 = _12523;
            }
            _19666 = _12524;
        }
        vec4 _22060 = vec4(_8489.xyz, 1.0);
        float _24323 = dot(_22060.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125));
        vec3 _9577 = normalize(max(_19666.xyz, vec3(0.001000000047497451305389404296875)));
        _22671 = saturate(mix(_22060.xyz, (_9577 * min(_24323 / dot(_9577.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), (3.0 * _24323) * max(_19666.x, max(_19666.y, _19666.z)))).xyz, vec3(_Globals_.g_flIridescentStrength * _17348)));
    }
    else
    {
        _22671 = _8489;
    }
    vec3 _17892 = mix(_17115, _14797, bvec3(all(equal(_17115, vec3(1.0)))));
    vec3 _10560 = _24347.xyz;
    vec3 _11102 = dFdx(_10560);
    vec3 _9175 = dFdy(_10560);
    vec3 _10347 = _11102.xyz;
    vec3 _12420 = _9175.xyz;
    vec2 _11004 = max(_17344.xy, vec2(pow(saturate(max(dot(_10347, _10347), dot(_12420, _12420))), 0.333000004291534423828125)));
    vec3 _10170 = -_24347;
    vec3 _24741 = _14797.xyz;
    vec4 _23875 = vec4(_24741, 1.0);
    vec3 _18708 = vec3(dot(PerViewLightingConstantBufferGpu_t._m5._m0[0].xyzw, _23875), dot(PerViewLightingConstantBufferGpu_t._m5._m0[1].xyzw, _23875), dot(PerViewLightingConstantBufferGpu_t._m5._m0[2].xyzw, _23875));
    bvec4 _24465 = notEqual(PerViewConstantBufferCsgo_t._m1, ivec4(0));
    float _21716;
    if (_24465.x)
    {
        vec3 _11394 = _24347.xyz;
        vec2 _11103 = ((floor(_11408.xy * PerViewConstantBufferCsgo_t._m17) * PerViewConstantBufferCsgo_t._m16.xy) + (PerViewConstantBufferCsgo_t._m16.xy * 0.5)).xy;
        vec4 _18418 = textureGather(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m8], g_bindless_Sampler[_Globals_.g_sCookieSampler]), _11103).xyzw - _11408.zzzz;
        float _18579 = _18418.w;
        float _12063 = _18418.z;
        bool _12290 = abs(_12063) < _18579;
        vec2 _23190;
        if (_12290)
        {
            _23190 = vec2(PerViewConstantBufferCsgo_t._m16.x, 0.0);
        }
        else
        {
            _23190 = vec2(0.0);
        }
        float _20965 = _12290 ? _12063 : _18579;
        float _15372 = _18418.x;
        bool _12291 = abs(_15372) < _20965;
        vec2 _23191;
        if (_12291)
        {
            _23191 = vec2(0.0, PerViewConstantBufferCsgo_t._m16.y);
        }
        else
        {
            _23191 = _23190;
        }
        vec4 _10011 = normalize(vec4(PerViewLightingConstantBufferGpu_t._m7.x * fma(dot(_10170, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[0].xy, 0.25))), 0.5, 0.5), PerViewLightingConstantBufferGpu_t._m7.y * fma(dot(_10170, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[1].xy, 0.25))), 0.5, 0.5), PerViewLightingConstantBufferGpu_t._m7.z * fma(dot(_10170, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[2].xy, 0.25))), 0.5, 0.5), PerViewLightingConstantBufferGpu_t._m7.w * fma(dot(_10170, normalize(vec3(PerViewLightingConstantBufferGpu_t._m6._m0[3].xy, 0.25))), 0.5, 0.5)));
        vec4 _13237 = max(vec4(dot(PerViewLightingConstantBufferGpu_t._m6._m0[0].xyz, _11394), dot(PerViewLightingConstantBufferGpu_t._m6._m0[1].xyz, _11394), dot(PerViewLightingConstantBufferGpu_t._m6._m0[2].xyz, _11394), dot(PerViewLightingConstantBufferGpu_t._m6._m0[3].xyz, _11394)).xyzw, vec4(0.0)) * normalize(saturate(((_10011 - vec4(max(max(_10011.x, _10011.y), max(_10011.z, _10011.w)))) + vec4(0.20000000298023223876953125)) * vec4(5.0)));
        _21716 = (1.0 / (dot(_13237, vec4(1.0)) + PerViewLightingConstantBufferGpu_t._m8.x)) * (PerViewLightingConstantBufferGpu_t._m8.x + dot(_13237, textureLod(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m7], g_bindless_Sampler[_Globals_.g_sPointClamp]), (_11103 + mix(_23191, PerViewConstantBufferCsgo_t._m16.xy, bvec2(abs(_18418.y) < (_12291 ? _15372 : _20965))).xy).xy, 0.0)));
    }
    else
    {
        _21716 = 1.0;
    }
    float _21717;
    if (notEqual(PerViewConstantBufferCsgo_t._m0, ivec4(0)).w)
    {
        _21717 = _21716 * textureLod(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m9], g_bindless_Sampler[_Globals_.g_sUserConfig]), (_11408.xy * PerViewConstantBuffer_t._m4.xy).xy, 0.0).x;
    }
    else
    {
        _21717 = _21716;
    }
    float _21718;
    SPIRV_CROSS_BRANCH
    if (PerViewLightingConstantBufferGpu_t._m18 != 0)
    {
        int _24107;
        int _10220;
        float _13220;
        vec3 _14975;
        int _13039 = 0;
        for (;;)
        {
            if (!(_13039 < PerViewLightingConstantBufferGpu_t._m18))
            {
                _13220 = 1.0;
                _14975 = vec3(0.0);
                _10220 = -1;
                break;
            }
            vec4 _18322 = vec4(input_1.xyz, 1.0) * PerViewLightingConstantBufferGpu_t._m25._m0[_13039];
            float _12780 = _18322.x;
            if (max(abs(_12780), abs(_18322.y)) < PerViewLightingConstantBufferGpu_t._m20[_13039])
            {
                vec3 _19470 = vec3(_12780, _18322.yz);
                vec2 _24804 = _19470.xy;
                vec2 _22202 = vec2(1.0) - saturate((abs(_24804) * vec2(PerViewLightingConstantBufferGpu_t._m22)) + vec2(PerViewLightingConstantBufferGpu_t._m21));
                vec2 _20561 = (_24804 * PerViewLightingConstantBufferGpu_t._m26._m0[_13039].zw) + PerViewLightingConstantBufferGpu_t._m26._m0[_13039].xy;
                vec3 _20522 = _19470;
                _20522.x = _20561.x;
                _20522.y = _20561.y;
                _13220 = saturate(_22202.x * _22202.y);
                _14975 = _20522;
                _10220 = _13039;
                break;
            }
            _24107 = _13039 + 1;
            _13039 = _24107;
            continue;
        }
        float _19363;
        if (_10220 >= 0)
        {
            vec2 _7045;
            vec2 _7046;
            vec2 _7749;
            float _8969;
            float _8970;
            float _15996;
            float _17357;
            vec2 _18870;
            vec4 _20609;
            vec4 _24438;
            uint _24711;
            float _23749;
            do
            {
                float _21452 = saturate(_14975.z + PerViewLightingConstantBufferGpu_t._m19);
                _20609 = PerViewLightingConstantBufferGpu_t._m0;
                _24438 = PerViewLightingConstantBufferGpu_t._m1;
                _24711 = _Globals_.g_tShadowDepthBufferCmpSampler;
                _17357 = PerViewLightingConstantBufferGpu_t._m2.z;
                _15996 = PerViewLightingConstantBufferGpu_t._m3.z;
                _18870 = vec2(_17357, _15996);
                _8969 = PerViewLightingConstantBufferGpu_t._m2.y;
                _7045 = vec2(_8969, _15996);
                _8970 = PerViewLightingConstantBufferGpu_t._m3.y;
                _7046 = vec2(_17357, _8970);
                _7749 = vec2(_8969, _8970);
                float _15310 = dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _18870).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _7045).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _7046).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + _7749).xy, _21452), 0.0)).xyzw, vec4(0.25));
                bool _12930;
                if (_15310 == 0.0)
                {
                    _12930 = true;
                }
                else
                {
                    _12930 = _15310 == 1.0;
                }
                if (_12930)
                {
                    _23749 = _15310;
                    break;
                }
                _23749 = ((_15310 * (_20609.w * 4.0)) + dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(_17357, 0.0)).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(_8969, 0.0)).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(0.0, _8970)).xy, _21452), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_14975.xy + vec2(0.0, _15996)).xy, _21452), 0.0)).xyzw, _24438.xxxx)) + (textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3(_14975.xy, _21452), 0.0) * _24438.y);
                break;
            } while(false);
            float _12526;
            SPIRV_CROSS_BRANCH
            if (_13220 < 1.0)
            {
                float _7934;
                if (_10220 < (PerViewLightingConstantBufferGpu_t._m18 - 1))
                {
                    int _15339 = _10220 + 1;
                    vec4 _19671 = vec4(input_1.xyz, 1.0) * PerViewLightingConstantBufferGpu_t._m25._m0[_15339];
                    vec2 _20562 = (_19671.xy * PerViewLightingConstantBufferGpu_t._m26._m0[_15339].zw) + PerViewLightingConstantBufferGpu_t._m26._m0[_15339].xy;
                    vec3 _20523;
                    _20523.x = _20562.x;
                    _20523.y = _20562.y;
                    float _12525;
                    do
                    {
                        float _20344 = saturate(_19671.z + PerViewLightingConstantBufferGpu_t._m19);
                        float _15311 = dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + _18870).xy, _20344), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + _7045).xy, _20344), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + _7046).xy, _20344), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + _7749).xy, _20344), 0.0)).xyzw, vec4(0.25));
                        bool _12931;
                        if (_15311 == 0.0)
                        {
                            _12931 = true;
                        }
                        else
                        {
                            _12931 = _15311 == 1.0;
                        }
                        if (_12931)
                        {
                            _12525 = _15311;
                            break;
                        }
                        _12525 = ((_15311 * (_20609.w * 4.0)) + dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + vec2(_17357, 0.0)).xy, _20344), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + vec2(_8969, 0.0)).xy, _20344), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + vec2(0.0, _8970)).xy, _20344), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3((_20523.xy + vec2(0.0, _15996)).xy, _20344), 0.0)).xyzw, _24438.xxxx)) + (textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_24711]), vec3(_20523.xy, _20344), 0.0) * _24438.y);
                        break;
                    } while(false);
                    _7934 = _12525;
                }
                else
                {
                    _7934 = 1.0;
                }
                _12526 = mix(_7934, _23749, _13220);
            }
            else
            {
                _12526 = _23749;
            }
            _19363 = _12526;
        }
        else
        {
            _19363 = 1.0;
        }
        float _13279 = mix(_19363, 1.0, saturate((distance(_10061.xyz, PerViewConstantBuffer_t._m7) * PerViewLightingConstantBufferGpu_t._m24) + PerViewLightingConstantBufferGpu_t._m23));
        float _12527;
        if (_24465.y)
        {
            _12527 = min(_13279, textureLod(sampler2D(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m10], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), (_11408.xy * PerViewConstantBuffer_t._m4.xy).xy, 0.0).z);
        }
        else
        {
            _12527 = _13279;
        }
        _21718 = _12527;
    }
    else
    {
        _21718 = 1.0;
    }
    vec3 _9716;
    vec3 _24878;
    SPIRV_CROSS_BRANCH
    if ((dot(PerViewLightingConstantBufferGpu_t._m16.xyz, _24741) * _21718) > 0.0)
    {
        vec3 _15460 = mix(_17892, _24741, bvec3(all(equal(_17892, vec3(1.0)))));
        float _13811 = max(0.0, dot(_14797.xyz, PerViewLightingConstantBufferGpu_t._m16.xyz));
        vec3 _17893 = vec3(_13811);
        vec3 _18223;
        if (_13694 > 0.0)
        {
            float _8811 = dot(_15460, PerViewLightingConstantBufferGpu_t._m16.xyz);
            float _8124 = saturate(_13694);
            _18223 = mix(_17893.xyz, vec3((((0.5 + (_13811 * 0.5)) + pow(1.0 - saturate(_8811), 4.0)) * saturate((_8811 + 0.20000000298023223876953125) * 4.0)) * saturate(mix(dot(mix(_24741, _15460, vec3(10.0)), PerViewLightingConstantBufferGpu_t._m16.xyz), 1.0, _8124))), vec3(_8124));
        }
        else
        {
            _18223 = _17893;
        }
        vec2 _17360 = max(_11004, vec2(PerViewLightingConstantBufferGpu_t._m16.w));
        vec3 _21889 = (-normalize(_10061.xyz - PerViewConstantBuffer_t._m7.xyz)).xyz;
        vec3 _12293 = normalize(PerViewLightingConstantBufferGpu_t._m16.xyz + _21889).xyz;
        vec3 _19012 = _15460.xyz;
        float _12394 = dot(_12293, _19012);
        float _9850 = _17360.x;
        float _25211 = _9850 * _9850;
        float _24198 = _25211 / (((_12394 * _12394) * ((_25211 * _25211) - 1.0)) + 1.0);
        float _16150 = _9850 + 1.0;
        float _6835 = (_16150 * _16150) * 0.125;
        float _19569 = 1.0 - _6835;
        vec3 _16828 = (PerViewLightingConstantBufferGpu_t._m17.xyz * _21718).xyz;
        _9716 = PerViewLightingConstantBufferGpu_t._m9.xyz + (_18223.xyz * _16828);
        _24878 = (((_22671.xyz + ((vec3(1.0) - _22671.xyz) * pow(max(9.9999999747524270787835121154785e-07, 1.0 - max(0.0, dot(PerViewLightingConstantBufferGpu_t._m16.xyz, _12293))), 5.0))) * ((_24198 * _24198) / ((4.0 * ((_13811 * _19569) + _6835)) * ((max(0.0, dot(_19012, _21889)) * _19569) + _6835)))).xyz * _13811).xyz * _16828;
    }
    else
    {
        _9716 = PerViewLightingConstantBufferGpu_t._m9.xyz;
        _24878 = vec3(0.0);
    }
    bvec4 _24467 = notEqual(PerViewConstantBufferCsgo_t._m2, ivec4(0));
    bool _20067 = _24467.x;
    vec4 _19364;
    if (_20067)
    {
        vec4 _18621 = vec4(_10061.xyz, 1.0).xyzw * PerViewConstantBufferCsgo_t._m15;
        float _20176 = _18621.w;
        vec2 _11414 = _18621.xy / vec2(_20176);
        vec4 _6654;
        _6654.x = clamp(((_11414.x + 1.0) * PerViewConstantBuffer_t._m3.x) * 0.5, 0.0, PerViewConstantBuffer_t._m3.x - 1.0);
        _6654.y = clamp(((1.0 - _11414.y) * PerViewConstantBuffer_t._m3.y) * 0.5, 0.0, PerViewConstantBuffer_t._m3.y - 1.0);
        _6654.w = _20176;
        _19364 = _6654;
    }
    else
    {
        _19364 = _11408;
    }
    uvec2 _7663 = uvec2(PerViewLightingConstantBufferGpu_t._m12.x);
    uvec2 _12088 = uvec2(_19364.xy - PerViewConstantBuffer_t._m2.xy) >> _7663;
    uint _10838 = PerViewLightingConstantBufferGpu_t._m10.y + (((_12088.y * PerViewLightingConstantBufferGpu_t._m12.y) + _12088.x) * PerViewLightingConstantBufferGpu_t._m10.z);
    uint _23393 = PerViewLightingConstantBufferGpu_t._m10.x + (uint(clamp(_19364.w * PerViewLightingConstantBufferGpu_t._m13.x, 0.0, PerViewLightingConstantBufferGpu_t._m13.y)) * PerViewLightingConstantBufferGpu_t._m10.z);
    vec3 _13222;
    vec3 _16354;
    _13222 = _9716;
    _16354 = _24878;
    uint _21567;
    vec3 _13223;
    vec3 _16355;
    uint _17017 = 0u;
    for (;;)
    {
        if (!(_17017 < PerViewLightingConstantBufferGpu_t._m10.z))
        {
            break;
        }
        uint _14475 = subgroupOr(g_CullBits_1._m0[_10838 + _17017] & g_CullBits_1._m0[_23393 + _17017]);
        _13223 = _16354;
        _16355 = _13222;
        uint _20346;
        vec3 _13224;
        vec3 _15682;
        uint _17018 = _14475;
        for (;;)
        {
            if (!(_17018 != 0u))
            {
                break;
            }
            int _12608 = int(uint(findLSB(_17018)) + (_17017 * 32u));
            _20346 = _17018 & (_17018 - 1u);
            do
            {
                vec4 _24893 = g_BarnLights_1._m0[_12608]._m0 * vec4(input_1.xyz, 1.0);
                vec3 _10521 = _24893.xyz / vec3(_24893.w);
                vec4 _22905;
                _22905.x = _10521.x;
                _22905.y = _10521.y;
                float _21875 = _10521.z;
                _22905.z = _21875;
                vec3 _21642 = _22905.xyz;
                bool _7444;
                if (all(greaterThan(_22905.xyz, vec3(-1.0, -1.0, 0.0))))
                {
                    _7444 = all(lessThan(_22905.xyz, vec3(1.0)));
                }
                else
                {
                    _7444 = false;
                }
                bool _12932;
                if (!_7444)
                {
                    _12932 = true;
                }
                else
                {
                    _12932 = !all(lessThanEqual(abs((g_BarnLights_1._m0[_12608]._m15 * vec4(input_1.xyz, 1.0)).xyz), vec3(1.0)));
                }
                if (_12932)
                {
                    _13224 = _13223;
                    _15682 = _16355;
                    break;
                }
                float _23571 = 2.0 * g_BarnLights_1._m0[_12608]._m5.y;
                float _18492 = (2.0 * g_BarnLights_1._m0[_12608]._m5.z) * g_BarnLights_1._m0[_12608]._m5.z;
                float _14805 = 2.0 * g_BarnLights_1._m0[_12608]._m5.x;
                float _9070 = _14805 * g_BarnLights_1._m0[_12608]._m5.y;
                float _17365 = 2.0 * g_BarnLights_1._m0[_12608]._m5.w;
                float _19825 = _17365 * g_BarnLights_1._m0[_12608]._m5.z;
                vec3 _16268 = vec3(_9070 - _19825, (1.0 - (_14805 * g_BarnLights_1._m0[_12608]._m5.x)) - _18492, (_23571 * g_BarnLights_1._m0[_12608]._m5.z) + (_17365 * g_BarnLights_1._m0[_12608]._m5.x)) * g_BarnLights_1._m0[_12608]._m6.z;
                float _21316;
                if (g_BarnLights_1._m0[_12608]._m3.z > 0.0)
                {
                    _21316 = smoothstep(0.0, 1.0, _21875 * g_BarnLights_1._m0[_12608]._m3.z);
                }
                else
                {
                    _21316 = 1.0;
                }
                float _19667;
                if (g_BarnLights_1._m0[_12608]._m3.w > 0.0)
                {
                    _19667 = _21316 * smoothstep(0.0, 1.0, (1.0 - _21875) * g_BarnLights_1._m0[_12608]._m3.w);
                }
                else
                {
                    _19667 = _21316;
                }
                vec3 _11308;
                float _11633;
                if (g_BarnLights_1._m0[_12608]._m2.w != 0.0)
                {
                    vec3 _10017 = g_BarnLights_1._m0[_12608]._m2.xyz - input_1.xyz;
                    float _18345 = dot(_10017, _10017);
                    float _17647 = sqrt(_18345);
                    vec3 _20958 = _10017 - _16268;
                    vec3 _10221;
                    do
                    {
                        vec3 _20229 = (_10017 + _16268) - _20958;
                        float _25105 = dot(-_20958, _20229);
                        if (_25105 <= 0.0)
                        {
                            _10221 = _20958;
                            break;
                        }
                        else
                        {
                            _10221 = _20958 + (_20229 * min(1.0, _25105 / dot(_20229, _20229)));
                            break;
                        }
                        break; // unreachable workaround
                    } while(false);
                    _11308 = _10017 / vec3(_17647);
                    _11633 = ((_19667 * (g_BarnLights_1._m0[_12608]._m2.w / max(_18345, g_BarnLights_1._m0[_12608]._m2.w))) * smoothstep(0.0, 1.0, g_BarnLights_1._m0[_12608]._m3.x + (g_BarnLights_1._m0[_12608]._m3.y * _17647))) * saturate(g_BarnLights_1._m0[_12608]._m6.x + (g_BarnLights_1._m0[_12608]._m6.y * dot(vec3((1.0 - (_23571 * g_BarnLights_1._m0[_12608]._m5.y)) - _18492, _9070 + _19825, (_14805 * g_BarnLights_1._m0[_12608]._m5.z) - (_17365 * g_BarnLights_1._m0[_12608]._m5.y)), normalize(_10221))));
                }
                else
                {
                    _11308 = g_BarnLights_1._m0[_12608]._m2.xyz;
                    _11633 = _19667;
                }
                vec3 _17828 = (g_BarnLights_1._m0[_12608]._m4.xyz * 1.0).xyz * _11633;
                bool _24444;
                if (g_BarnLights_1._m0[_12608]._m8.z > 0.0)
                {
                    _24444 = !_20067;
                }
                else
                {
                    _24444 = false;
                }
                vec3 _21548;
                SPIRV_CROSS_BRANCH
                if (g_BarnLights_1._m0[_12608]._m4.w == 0.0)
                {
                    float _10344;
                    do
                    {
                        vec2 _22212 = abs(_22905.xy);
                        if (g_BarnLights_1._m0[_12608]._m9.z == 0.0)
                        {
                            _10344 = smoothstep(1.0, g_BarnLights_1._m0[_12608]._m9.x, _22212.x) * smoothstep(1.0, g_BarnLights_1._m0[_12608]._m9.y, _22212.y);
                            break;
                        }
                        else
                        {
                            float _11473 = _22212.x;
                            float _15267 = 2.0 / g_BarnLights_1._m0[_12608]._m9.z;
                            float _15026 = _22212.y;
                            float _23042 = (-0.5) * g_BarnLights_1._m0[_12608]._m9.z;
                            float _11981 = (g_BarnLights_1._m0[_12608]._m9.x * g_BarnLights_1._m0[_12608]._m9.y) * pow(max(pow(g_BarnLights_1._m0[_12608]._m9.y * _11473, _15267) + pow(g_BarnLights_1._m0[_12608]._m9.x * _15026, _15267), 1.1754943508222875079687365372222e-38), _23042);
                            float _16619 = pow(max(pow(_11473, _15267) + pow(_15026, _15267), 1.1754943508222875079687365372222e-38), _23042);
                            if (_11981 < _16619)
                            {
                                _10344 = smoothstep(_16619, _11981, 1.0);
                                break;
                            }
                            else
                            {
                                _10344 = float(_16619 > 1.0);
                                break;
                            }
                            break; // unreachable workaround
                        }
                        break; // unreachable workaround
                    } while(false);
                    _21548 = _17828.xyz * _10344;
                }
                else
                {
                    vec3 _12531;
                    if (g_BarnLights_1._m0[_12608]._m4.w < 0.0)
                    {
                        vec4 _17795 = vec4(-g_BarnLights_1._m0[_12608]._m5.xyz, g_BarnLights_1._m0[_12608]._m5.w);
                        vec4 _19008 = _17795.xyzw * vec4(-1.0, -1.0, -1.0, 1.0);
                        vec3 _25000 = _19008.xyz;
                        vec3 _23629 = vec4((-_11308).xyz, 0.0).xyz;
                        float _15156 = -dot(_23629, _25000);
                        vec3 _20526 = vec4((_23629 * _19008.w) + cross(_23629, _25000), _15156).xyz;
                        vec3 _23592 = _17795.xyz;
                        vec3 _12170 = ((_20526 * g_BarnLights_1._m0[_12608]._m5.w) + (_23592 * _15156)) + cross(_23592, _20526);
                        vec3 _14081 = vec3(vec2(atan(_12170.y, -_12170.x) * 0.15915493667125701904296875, acos(_12170.z) * 0.3183098733425140380859375), -g_BarnLights_1._m0[_12608]._m4.w);
                        vec2 _20564 = (_14081.xy * g_BarnLights_1._m0[_12608]._m9.zw) + g_BarnLights_1._m0[_12608]._m9.xy;
                        vec3 _20527 = _14081;
                        _20527.x = _20564.x;
                        _20527.y = _20564.y;
                        _12531 = _17828.xyz * textureLod(sampler3D(g_bindless_Texture3D_float4[PerViewLightingConstantBufferGpu_t._m28], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), _20527.xyz, 0.0).xyz;
                    }
                    else
                    {
                        vec3 _13797 = vec3(fma(_22905.xy, vec2(0.5, -0.5), vec2(0.5)), g_BarnLights_1._m0[_12608]._m4.w);
                        vec2 _20563 = (_13797.xy * g_BarnLights_1._m0[_12608]._m9.zw) + g_BarnLights_1._m0[_12608]._m9.xy;
                        vec3 _20525 = _13797;
                        _20525.x = _20563.x;
                        _20525.y = _20563.y;
                        _12531 = _17828.xyz * textureLod(sampler3D(g_bindless_Texture3D_float4[PerViewLightingConstantBufferGpu_t._m28], g_bindless_Sampler[_Globals_.g_sCookieSampler]), _20525.xyz, 0.0).xyz;
                    }
                    _21548 = _12531;
                }
                if (all(equal(_21548.xyz, vec3(0.0))))
                {
                    _13224 = _13223;
                    _15682 = _16355;
                    break;
                }
                vec3 _21549;
                if (_24444)
                {
                    vec3 _19629;
                    if ((g_BarnLights_1._m0[_12608]._m13 & 4u) != 0u)
                    {
                        vec2 _6286 = _22905.yx * vec2(1.0, -1.0);
                        vec3 _23750 = _21642;
                        _23750.x = _6286.x;
                        _23750.y = _6286.y;
                        _19629 = _23750;
                    }
                    else
                    {
                        _19629 = _21642;
                    }
                    float _24973;
                    do
                    {
                        float _21462 = saturate(_19629.z + PerViewLightingConstantBufferGpu_t._m19);
                        vec2 _10393 = vec3(fma(_19629.xy, g_BarnLights_1._m0[_12608]._m8.zw, g_BarnLights_1._m0[_12608]._m8.xy), _19629.z).xy;
                        float _15312 = dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.z, PerViewLightingConstantBufferGpu_t._m3.z)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.y, PerViewLightingConstantBufferGpu_t._m3.z)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.z, PerViewLightingConstantBufferGpu_t._m3.y)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.y, PerViewLightingConstantBufferGpu_t._m3.y)).xy, _21462), 0.0)).xyzw, vec4(0.25));
                        bool _12933;
                        if (_15312 == 0.0)
                        {
                            _12933 = true;
                        }
                        else
                        {
                            _12933 = _15312 == 1.0;
                        }
                        if (_12933)
                        {
                            _24973 = _15312;
                            break;
                        }
                        _24973 = ((_15312 * (PerViewLightingConstantBufferGpu_t._m0.w * 4.0)) + dot(vec4(textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.z, 0.0)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(PerViewLightingConstantBufferGpu_t._m2.y, 0.0)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(0.0, PerViewLightingConstantBufferGpu_t._m3.y)).xy, _21462), 0.0), textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3((_10393 + vec2(0.0, PerViewLightingConstantBufferGpu_t._m3.z)).xy, _21462), 0.0)).xyzw, PerViewLightingConstantBufferGpu_t._m1.xxxx)) + (textureLod(sampler2DShadow(g_bindless_Texture2D_float4[PerViewLightingConstantBufferGpu_t._m27], g_bindless_Sampler_1[_Globals_.g_tShadowDepthBufferCmpSampler]), vec3(_10393, _21462), 0.0) * PerViewLightingConstantBufferGpu_t._m1.y);
                        break;
                    } while(false);
                    vec3 _19878 = _21548.xyz * mix(1.0, _24973, g_BarnLights_1._m0[_12608]._m12);
                    if (all(equal(_19878.xyz, vec3(0.0))))
                    {
                        _13224 = _13223;
                        _15682 = _16355;
                        break;
                    }
                    _21549 = _19878;
                }
                else
                {
                    _21549 = _21548;
                }
                vec3 _15462 = mix(_17892, _24741, bvec3(all(equal(_17892, vec3(1.0)))));
                float _13812 = max(0.0, dot(_14797.xyz, _11308.xyz));
                vec3 _17896 = vec3(_13812);
                vec3 _18224;
                if (_13694 > 0.0)
                {
                    float _8812 = dot(_15462, _11308.xyz);
                    float _8125 = saturate(_13694);
                    _18224 = mix(_17896.xyz, vec3((((0.5 + (_13812 * 0.5)) + pow(1.0 - saturate(_8812), 4.0)) * saturate((_8812 + 0.20000000298023223876953125) * 4.0)) * saturate(mix(dot(mix(_24741, _15462, vec3(10.0)), _11308.xyz), 1.0, _8125))), vec3(_8125));
                }
                else
                {
                    _18224 = _17896;
                }
                vec2 _17368 = max(_11004, vec2(g_BarnLights_1._m0[_12608]._m11));
                vec3 _21890 = (-normalize(_10061.xyz - PerViewConstantBuffer_t._m7.xyz)).xyz;
                vec3 _12295 = normalize(_11308.xyz + _21890).xyz;
                vec3 _19014 = _15462.xyz;
                float _12395 = dot(_12295, _19014);
                float _9856 = _17368.x;
                float _25212 = _9856 * _9856;
                float _24199 = _25212 / (((_12395 * _12395) * ((_25212 * _25212) - 1.0)) + 1.0);
                float _16151 = _9856 + 1.0;
                float _6836 = (_16151 * _16151) * 0.125;
                float _19577 = 1.0 - _6836;
                _13224 = _13223.xyz + ((((_22671.xyz + ((vec3(1.0) - _22671.xyz) * pow(max(9.9999999747524270787835121154785e-07, 1.0 - max(0.0, dot(_11308.xyz, _12295))), 5.0))) * ((_24199 * _24199) / ((4.0 * ((_13812 * _19577) + _6836)) * ((max(0.0, dot(_19014, _21890)) * _19577) + _6836)))).xyz * _13812).xyz * _21549.xyz);
                _15682 = _16355.xyz + (_18224.xyz * _21549.xyz);
                break;
            } while(false);
            _13223 = _13224;
            _16355 = _15682;
            _17018 = _20346;
            continue;
        }
        _21567 = _17017 + 1u;
        _13222 = _16355;
        _16354 = _13223;
        _17017 = _21567;
        continue;
    }
    vec3 _10147 = normalize(_10061.xyz - PerViewConstantBuffer_t._m7.xyz);
    vec3 _19257 = -_10147;
    float _17364 = _11004.x + _11004.y;
    float _19587 = _17364 * _17364;
    float _17751 = dot(_11004.xy, vec2(0.5));
    vec3 _6519 = _17892.xyz;
    vec3 _19081 = _17892.xyz;
    float _12856 = PerViewLightingConstantBufferGpu_t._m14.y * sqrt(_17751);
    vec3 _11904 = _10061.xyz;
    vec3 _11019;
    vec4 _14444;
    if (PerViewConstantBufferCsgo_t._m29 != 0.0)
    {
        float _9642 = dot(vec4(((_11904 + PerViewConstantBuffer_t._m6.xyz) + ((-PerViewConstantBuffer_t._m9) * PerViewConstantBufferCsgo_t._m29)).xyz, 1.0), vec4(PerViewConstantBuffer_t._m9.xyz, dot((PerViewConstantBuffer_t._m6.xyz + PerViewConstantBuffer_t._m7.xyz).xyz + (PerViewConstantBuffer_t._m9.xyz * PerViewConstantBuffer_t._m5), PerViewConstantBuffer_t._m9.xyz)));
        vec3 _21721;
        if (_9642 <= 0.0)
        {
            _21721 = _10061;
        }
        else
        {
            _21721 = _11904 + ((-PerViewConstantBuffer_t._m9.xyz) * _9642);
        }
        vec4 _19975 = vec4(_21721.xyz, 1.0) * PerViewConstantBufferCsgo_t._m15;
        float _20177 = _19975.w;
        vec2 _11415 = _19975.xy / vec2(_20177);
        vec4 _6655;
        _6655.x = clamp(((_11415.x + 1.0) * PerViewConstantBuffer_t._m3.x) * 0.5, 0.0, PerViewConstantBuffer_t._m3.x - 1.0);
        _6655.y = clamp(((1.0 - _11415.y) * PerViewConstantBuffer_t._m3.y) * 0.5, 0.0, PerViewConstantBuffer_t._m3.y - 1.0);
        _6655.w = _20177;
        _11019 = _21721;
        _14444 = _6655;
    }
    else
    {
        _11019 = _11904;
        _14444 = _11408.xyzw;
    }
    float _22061 = _17751 * _17751;
    float _20726 = saturate(1.0 - _22061);
    vec3 _25271 = normalize(mix(_6519, reflect(_10147.xyz, _19081).xyz, vec3(_20726 * (sqrt(_20726) + _22061))));
    uvec2 _6815 = uvec2(_14444.xy - PerViewConstantBuffer_t._m2.xy) >> _7663;
    uint _12130 = PerViewLightingConstantBufferGpu_t._m11.y + (((_6815.y * PerViewLightingConstantBufferGpu_t._m12.y) + _6815.x) * PerViewLightingConstantBufferGpu_t._m11.z);
    uint _23394 = PerViewLightingConstantBufferGpu_t._m11.x + (uint(clamp(_14444.w * PerViewLightingConstantBufferGpu_t._m13.x, 0.0, PerViewLightingConstantBufferGpu_t._m13.y)) * PerViewLightingConstantBufferGpu_t._m11.z);
    vec4 _13227;
    float _16356;
    vec3 _17371;
    _13227 = vec4(0.0);
    _16356 = 0.00999999977648258209228515625;
    _17371 = vec3(0.0);
    uint _8911;
    vec4 _13231;
    vec3 _14893;
    float _16358;
    bool _18392;
    uint _17020 = 0u;
    bool _17372 = false;
    for (;;)
    {
        bool _12934;
        if (_17020 < PerViewLightingConstantBufferGpu_t._m11.z)
        {
            _12934 = !_17372;
        }
        else
        {
            _12934 = false;
        }
        if (!_12934)
        {
            break;
        }
        uint _14476 = subgroupOr(g_CullBits_1._m0[_12130 + _17020] & g_CullBits_1._m0[_23394 + _17020]);
        vec3 _13228;
        vec4 _16357;
        _13228 = _17371;
        _16357 = _13227;
        uint _10172;
        vec3 _13230;
        vec4 _16389;
        float _16625;
        uint _17021 = _14476;
        float _17373 = _16356;
        for (;;)
        {
            if (!(_17021 != 0u))
            {
                _13231 = _16357;
                _16358 = _17373;
                _14893 = _13228;
                _18392 = _17372;
                break;
            }
            uint _18211 = uint(findLSB(_17021));
            int _12614 = int(_18211 + (_17020 * 32u));
            _10172 = _17021 & (_17021 - 1u);
            vec3 _7770 = (PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m0 * vec4(_11019.xyz, 1.0)).xyz;
            vec3 _8813 = saturate((_7770 - PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m1) * PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m5.xyz);
            vec3 _19668 = saturate((PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m3 - _7770) * PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m5.xyz);
            float _17379 = min(min(_8813.x, min(_8813.y, _8813.z)), min(_19668.x, min(_19668.y, _19668.z)));
            if (_17379 == 0.0)
            {
                _13230 = _13228;
                _16389 = _16357;
                _16625 = _17373;
                _13228 = _13230;
                _16357 = _16389;
                _17373 = _16625;
                _17021 = _10172;
                continue;
            }
            vec3 _19630;
            if (PerViewConstantBufferCsgo_t._m28 != 0.0)
            {
                vec3 _19779 = PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m1 + ((PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m3 - PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m1) * 0.5);
                _19630 = ((_7770 - _19779) * PerViewConstantBufferCsgo_t._m28) + _19779;
            }
            else
            {
                _19630 = _7770;
            }
            vec3 _7648 = (PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m0 * vec4(_25271.xyz, 0.0)).xyz;
            vec3 _11325 = max(((PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m3.xyz - _19630.xyz) / _7648).xyz, ((PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m1.xyz - _19630.xyz) / _7648).xyz);
            float _11076 = ((_17379 * _17379) * (((-2.0) * _17379) + 3.0)) * (1.0 - _17373);
            float _13713 = _17373 + _11076;
            vec3 _15431 = _13228 + ((textureLod(samplerCubeArray(g_bindless_TextureCubeArray[PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m4], g_bindless_Sampler[_Globals_.g_sTrilinearWrap]), vec4(mix(_19630.xyz + (_7648 * abs(min(_11325.x, min(_11325.y, _11325.z)))), _7648, vec3(_17751)).xyz, float(PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m2)), _12856).xyz * PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m6) * _11076);
            vec4 _7465 = _16357 + (PerViewLightingConstantBufferGpu_t._m15._m0[_12614]._m7 * _11076);
            if (_13713 > 0.9900000095367431640625)
            {
                _13231 = _7465;
                _16358 = _13713;
                _14893 = _15431;
                _18392 = true;
                break;
            }
            _13230 = _15431;
            _16389 = _7465;
            _16625 = _13713;
            _13228 = _13230;
            _16357 = _16389;
            _17373 = _16625;
            _17021 = _10172;
            continue;
        }
        _8911 = _17020 + 1u;
        _13227 = _13231;
        _16356 = _16358;
        _17371 = _14893;
        _17372 = _18392;
        _17020 = _8911;
        continue;
    }
    vec4 _11487 = textureLod(sampler2DArray(g_bindless_Texture2DArray_float4[PerViewConstantBufferCsgo_t._m5], g_bindless_Sampler[_Globals_.g_sBilinearClamp]), vec3((vec2(_17751, sqrt(1.0 - max(0.0, dot(_19257.xyz, _6519)))) * 0.984375) + vec2(0.0078125), 1.0).xyz, 0.0);
    vec3 _7300 = mix(_11487.xxx, _11487.yyy, _22671);
    float _21883 = 1.0 - _11487.y;
    vec3 _15517 = _22671 + ((vec3(1.0) - _22671) * vec3(0.0476190485060214996337890625));
    vec3 _23209 = ((_7300 * _15517) / (vec3(1.0) - (_15517 * _21883))) * _21883;
    vec3 _13436 = vec3(_21717 * _17345).xyz;
    vec3 _17074 = _13222.xyz + ((_18708 * (vec3(1.0) - (_7300 + _23209))).xyz * _13436).xyz;
    vec3 _22701 = _17074 * (_17349.xyz * pow(1.0 - _17350, _Globals_.g_flMetalnessTransitionBias)).xyz;
    vec4 _11665 = vec4(_22701, _17347);
    vec3 _15764 = _11665.xyz + _17346.xyz;
    vec4 _20529 = _11665;
    _20529.x = _15764.x;
    _20529.y = _15764.y;
    _20529.z = _15764.z;
    vec3 _15765 = _20529.xyz + ((_16354 * (vec3(1.0) + (_22671 * ((0.125 * (_19587 * _19587)) * saturate(dot(_17892, _19257)))))).xyz * _13436).xyz;
    vec4 _20530 = _20529;
    _20530.x = _15765.x;
    _20530.y = _15765.y;
    _20530.z = _15765.z;
    vec3 _15740 = _20530.xyz + ((((_17371 / vec3(_16356)).xyz * min(dot(_18708.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)) / dot(vec4(_19081, 1.0), (_13227 / vec4(_16356)).xyzw), max((_17751 * PerViewLightingConstantBufferGpu_t._m4.x) + PerViewLightingConstantBufferGpu_t._m4.y, 1.0))).xyz * (_7300 + _23209)).xyz * _13436).xyz;
    vec4 _13903 = _20530;
    _13903.x = _15740.x;
    _13903.y = _15740.y;
    _13903.z = _15740.z;
    vec3 _20178 = _13903.xyz + (_17074 * _16353.xyz);
    vec4 _20531 = _13903;
    _20531.x = _20178.x;
    _20531.y = _20178.y;
    _20531.z = _20178.z;
    vec4 _19366;
    if (_Globals_.g_bFogEnabled != 0)
    {
        vec3 _21496;
        vec3 _6538 = _11904 - PerViewConstantBuffer_t._m7.xyz;
        vec3 _9071 = _6538.xyz;
        vec3 _19343;
        do
        {
            _21496 = _6538.xyz;
            bool _12938;
            if (dot(_21496, _21496) > PerViewConstantBufferCsgo_t._m21.x)
            {
                _12938 = (_10061.z * PerViewConstantBufferCsgo_t._m21.z) < PerViewConstantBufferCsgo_t._m21.y;
            }
            else
            {
                _12938 = false;
            }
            SPIRV_CROSS_BRANCH
            if (_12938)
            {
                float _17979 = length(_21496);
                vec2 _9349 = saturate(PerViewConstantBufferCsgo_t._m18.xy + (PerViewConstantBufferCsgo_t._m18.zw * vec2(mix(_17979, _17979 * PerViewConstantBufferCsgo_t._m30.y, _Globals_.g_flFogModificationAmount), _10061.z)));
                float _13537 = (pow(_9349.x, PerViewConstantBufferCsgo_t._m19.x) * pow(_9349.y, PerViewConstantBufferCsgo_t._m19.y)) * PerViewConstantBufferCsgo_t._m20.w;
                float _12715 = mix(_13537, _13537 * PerViewConstantBufferCsgo_t._m30.z, _Globals_.g_flFogModificationAmount);
                _19343 = mix(_20531.xyz, vec4(PerViewConstantBufferCsgo_t._m20.xyz, _12715).xyz, vec3(_12715));
                break;
            }
            _19343 = _20531.xyz;
            break;
        } while(false);
        vec4 _23944 = _20531;
        _23944.x = _19343.x;
        _23944.y = _19343.y;
        _23944.z = _19343.z;
        vec3 _19344;
        do
        {
            bool _12939;
            if (dot(_9071, _9071) > PerViewConstantBufferCsgo_t._m25.x)
            {
                _12939 = (PerViewConstantBufferCsgo_t._m25.z * _10061.z) < PerViewConstantBufferCsgo_t._m25.y;
            }
            else
            {
                _12939 = false;
            }
            if (_12939)
            {
                float _17980 = length(_21496);
                float _14672 = saturate(pow(max(0.0, (mix(_17980, _17980 * PerViewConstantBufferCsgo_t._m30.y, _Globals_.g_flFogModificationAmount) * PerViewConstantBufferCsgo_t._m22.y) + PerViewConstantBufferCsgo_t._m22.x), PerViewConstantBufferCsgo_t._m22.w)) * saturate(pow(max(0.0, (_10061.z * PerViewConstantBufferCsgo_t._m23.y) + PerViewConstantBufferCsgo_t._m23.x), PerViewConstantBufferCsgo_t._m23.z));
                float _16978 = saturate(_14672) * mix(PerViewConstantBufferCsgo_t._m25.w, PerViewConstantBufferCsgo_t._m25.w * PerViewConstantBufferCsgo_t._m30.z, _Globals_.g_flFogModificationAmount);
                _19344 = mix(_23944.xyz, vec4((textureLod(samplerCube(g_bindless_TextureCube_float4[PerViewConstantBufferCsgo_t._m6], g_bindless_Sampler[_Globals_.g_sTrilinearClamp]), normalize((PerViewConstantBufferCsgo_t._m24 * vec4(_9071, 0.0)).xyz).xyz, PerViewConstantBufferCsgo_t._m23.w * saturate(1.0 - (_14672 * PerViewConstantBufferCsgo_t._m22.z))) * PerViewConstantBufferCsgo_t._m26.x).xyz, _16978).xyz, vec3(_16978));
                break;
            }
            _19344 = _23944.xyz;
            break;
        } while(false);
        _23944.x = _19344.x;
        _23944.y = _19344.y;
        _23944.z = _19344.z;
        _19366 = _23944;
    }
    else
    {
        _19366 = _20531;
    }
    vec3 _19345;
    if (_Globals_.g_flSpawnInvulnerability > 0.0)
    {
        float _11151 = 1.0 - saturate(dot(_19257, _24741));
        _19345 = mix(_19366.xyz, _Globals_.g_cInvulnerabilityColor * (mix(dot(_19366.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125)), 0.5, 0.5) + (4.0 * pow(mix(_11151 * texelFetch(g_bindless_Texture2D_float4[PerViewConstantBufferCsgo_t._m4], ivec3(ivec2(_11408.xy) & PerViewConstantBufferCsgo_t._m14, 0).xy, 0).y, 1.0, _11151), mix(3.0, 6.0, 1.0 + (sin(PerViewConstantBuffer_t._m1 * 20.0) * 0.5))))), vec3(_Globals_.g_flSpawnInvulnerability));
    }
    else
    {
        _19345 = _19366.xyz;
    }
    vec4 _23946 = _19366;
    _23946.x = _19345.x;
    _23946.y = _19345.y;
    _23946.z = _19345.z;
    vec4 _9710;
    if (_Globals_.g_bStickerProjectionPreview != 0)
    {
        vec3 _25204 = mix(vec3(dot(_23946.xyz, vec3(0.2125000059604644775390625, 0.7153999805450439453125, 0.07209999859333038330078125))) + vec3(fract(((floor(_10061.x) + floor(_10061.y)) + floor(_10061.z)) * 0.5) * 0.20000000298023223876953125), _23946.xyz, vec3(saturate(_13219.x * 100.0)));
        vec4 _17898 = _23946;
        _17898.x = _25204.x;
        _17898.y = _25204.y;
        _17898.z = _25204.z;
        vec3 _25205 = mix(vec3(0.300000011920928955078125, 0.0, 0.0), _17898.xyz, vec3(_19148));
        vec4 _17899 = _17898;
        _17899.x = _25205.x;
        _17899.y = _25205.y;
        _17899.z = _25205.z;
        _9710 = _17899;
    }
    else
    {
        _9710 = _23946;
    }
    vec4 _21723;
    if (abs(_23261.y + 4.0) < 0.00999999977648258209228515625)
    {
        vec4 _19947 = _9710;
        _19947.w = step(0.89999997615814208984375, _13219.w);
        _21723 = _19947;
    }
    else
    {
        _21723 = _9710;
    }
    SPIRV_CROSS_BRANCH
    if (_Globals_.g_vKeychainGhostHandData.w > 0.0)
    {
        float _11567 = saturate((smoothstep(6.0, 2.0, distance(_Globals_.g_vKeychainGhostHandData.xyz, _11904)) - 1.0) * (-1.0));
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
    output_0 = _21723;
}


