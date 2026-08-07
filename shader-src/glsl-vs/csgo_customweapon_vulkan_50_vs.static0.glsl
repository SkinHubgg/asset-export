// SPIR-V reflection failed for backend HLSL:
// cbuffer ID 5618 (name: _Globals_), member index 0 (name: g_vPatternTexCoordXform0) cannot be expressed with either HLSL packing layout or packoffset.
//
// Re-attempting reflection with the GLSL backend.

// Source 2 Viewer 19.2.0.0 - https://valveresourceformat.github.io
// SPIR-V source (3960 bytes), GLSL reflection with SPIRV-Cross by KhronosGroup

#version 460

float _3;

struct _2303
{
    vec4 g_vPatternTexCoordXform0;
    vec4 g_vPatternTexCoordXform1;
    vec4 g_vWearTexCoordXform0;
    vec4 g_vWearTexCoordXform1;
    vec4 g_vGrungeTexCoordXform0;
    vec4 g_vGrungeTexCoordXform1;
    int g_bOverlayUsesUniqueUVs;
    int g_bOverlayUsesPatternUVs;
    vec4 g_vOverlayTexCoordXform0;
    vec4 g_vOverlayTexCoordXform1;
    vec4 g_vViewport;
};

layout(set = 0) uniform _2303 _Globals_;

layout(location = 0) in vec2 vPositionSs;
layout(location = 1) in vec4 vColor;
layout(location = 2) in vec2 vTexCoord;
layout(location = 0) out vec4 output_0;
layout(location = 1) out vec4 output_1;
layout(location = 2) out vec4 output_2;
layout(location = 3) out vec2 output_3;

void main()
{
    vec2 _15639 = (((vPositionSs.xy - _Globals_.g_vViewport.xy) * 2.0) / _Globals_.g_vViewport.zw) - vec2(1.0);
    vec4 _14779 = vec4(_15639.x, _3, 1.0, 1.0);
    vec3 _24030 = vColor.xyz * vec3(0.077399380505084991455078125);
    vec3 _7676 = pow((vColor.xyz * vec3(0.947867333889007568359375)) + vec3(0.052132703363895416259765625), vec3(2.400000095367431640625));
    float _21354;
    if (vColor.x <= 0.040449999272823333740234375)
    {
        _21354 = _24030.x;
    }
    else
    {
        _21354 = _7676.x;
    }
    float _21355;
    if (vColor.y <= 0.040449999272823333740234375)
    {
        _21355 = _24030.y;
    }
    else
    {
        _21355 = _7676.y;
    }
    float _19302;
    if (vColor.z <= 0.040449999272823333740234375)
    {
        _19302 = _24030.z;
    }
    else
    {
        _19302 = _7676.z;
    }
    float _24844 = dot(vTexCoord.xy, _Globals_.g_vPatternTexCoordXform0.xy) + _Globals_.g_vPatternTexCoordXform0.w;
    float _22325 = dot(vTexCoord.xy, _Globals_.g_vPatternTexCoordXform1.xy) + _Globals_.g_vPatternTexCoordXform1.w;
    vec2 _22247;
    if (_Globals_.g_bOverlayUsesPatternUVs != 0)
    {
        vec2 _12501;
        if (_Globals_.g_bOverlayUsesUniqueUVs != 0)
        {
            _12501 = vec2(dot(vTexCoord.xy, _Globals_.g_vOverlayTexCoordXform0.xy) + _Globals_.g_vOverlayTexCoordXform0.w, dot(vTexCoord.xy, _Globals_.g_vOverlayTexCoordXform1.xy) + _Globals_.g_vOverlayTexCoordXform1.w);
        }
        else
        {
            _12501 = vec2(_24844, _22325);
        }
        _22247 = _12501;
    }
    else
    {
        _22247 = vTexCoord;
    }
    output_0 = vec4(_21354, _21355, _19302, vColor.w);
    output_1 = vec4(vTexCoord, _24844, _22325);
    output_2 = vec4(dot(vTexCoord.xy, _Globals_.g_vWearTexCoordXform0.xy) + _Globals_.g_vWearTexCoordXform0.w, dot(vTexCoord.xy, _Globals_.g_vWearTexCoordXform1.xy) + _Globals_.g_vWearTexCoordXform1.w, dot(vTexCoord.xy, _Globals_.g_vGrungeTexCoordXform0.xy) + _Globals_.g_vGrungeTexCoordXform0.w, dot(vTexCoord.xy, _Globals_.g_vGrungeTexCoordXform1.xy) + _Globals_.g_vGrungeTexCoordXform1.w);
    output_3 = _22247;
    _14779.y = _15639.y;
    gl_Position = _14779;
}


