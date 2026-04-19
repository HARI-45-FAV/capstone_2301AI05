import { Handle, Position } from '@xyflow/react';

export const AdminNode = ({ data }: any) => (
  <div className="px-4 py-3 shadow-xl rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-black text-white font-bold border-4 border-slate-700 text-center min-w-[180px] hover:scale-105 transition-transform">
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400" />
    <div className="text-3xl mb-1">🏛️</div>
    <div className="text-lg">{data.name}</div>
    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">System Head</div>
  </div>
);

export const BranchNode = ({ data }: any) => (
  <div className="group relative px-4 py-3 shadow-lg rounded-[1.2rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold border-2 border-indigo-400 text-center min-w-[160px] hover:scale-105 transition-transform cursor-pointer" onClick={() => data.onCollapseToggle?.(data.id)}>
    <Handle type="target" position={Position.Top} className="w-2 h-2 bg-indigo-200" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-indigo-200" />
    <div className="text-2xl mb-1">{data.isCollapsed ? '🏫 (Hidden)' : '🏫'}</div>
    <div>{data.name} Branch</div>
    
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-black/90 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl border border-white/20">
      <p className="font-bold border-b border-white/20 pb-1 mb-1">Click to {data.isCollapsed ? 'Expand' : 'Collapse'}</p>
    </div>
  </div>
);

export const AdvisorNode = ({ data }: any) => (
  <div className="px-3 py-2 shadow-md bg-white dark:bg-slate-800 rounded-xl border-2 border-emerald-200 dark:border-slate-700 flex items-center gap-3 w-[220px] hover:scale-105 transition-transform cursor-pointer" onClick={() => data.onNodeClick?.(data)}>
    <Handle type="target" position={Position.Top} className="w-2 h-2" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 shrink-0 border border-emerald-200">
        {data.avatar ? <img src={`http://localhost:5000${data.avatar}`} alt="Avatar" className="w-full h-full object-cover"/> : (data.name ? data.name.split(' ').map((n:string)=>n.charAt(0)).slice(0,2).join('').toUpperCase() : '?')}
    </div>
    <div>
        <div className="font-bold text-sm truncate w-[140px] text-slate-900 dark:text-white">{data.name}</div>
        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wider uppercase">Faculty Advisor</div>
    </div>
  </div>
);

export const ProfessorNode = ({ data }: any) => (
  <div className="group relative px-3 py-2 shadow-md bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 w-[200px] hover:border-blue-400 transition-all cursor-pointer" onClick={() => data.onNodeClick?.(data)}>
    <Handle type="target" position={Position.Top} className="w-2 h-2" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0 border border-blue-200">
        {data.avatar ? <img src={`http://localhost:5000${data.avatar}`} alt="Avatar" className="w-full h-full object-cover"/> : (data.name ? data.name.split(' ').map((n:string)=>n.charAt(0)).slice(0,2).join('').toUpperCase() : '?')}
    </div>
    <div>
        <div className="font-bold text-xs truncate w-[130px] dark:text-slate-200">{data.name}</div>
        <div className="text-[10px] text-slate-500">Dept: {data.department}</div>
    </div>
    
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-black/95 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl border border-white/10">
      <p className="font-black border-b border-white/20 pb-1 mb-2">{data.name}</p>
      <div className="space-y-1">
        <p className="flex justify-between"><span>Courses:</span> <span className="font-bold text-blue-300">{data.courses?.length || 0}</span></p>
        <p className="flex justify-between"><span>Students:</span> <span className="font-bold text-emerald-300">{data.courses?.reduce((acc:any, c:any)=> acc + (c.studentsCount||0), 0)}</span></p>
      </div>
    </div>
  </div>
);

export const CourseNode = ({ data }: any) => (
  <div className="px-3 py-2 shadow-sm rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-700/50 text-center min-w-[130px] hover:scale-105 transition-transform cursor-pointer" onClick={() => data.onNodeClick?.(data)}>
    <Handle type="target" position={Position.Top} className="w-2 h-2 bg-amber-400" />
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-amber-400" />
    <div className="text-xl mb-1">📘</div>
    <div className="font-bold text-xs truncate max-w-[120px] dark:text-white">{data.name}</div>
    <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{data.code}</div>
  </div>
);

export const StudentCountNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-md rounded-full bg-emerald-100 border-2 border-emerald-300 text-center min-w-[120px] flex items-center justify-center gap-2 hover:scale-110 transition-transform">
    <Handle type="target" position={Position.Top} className="w-2 h-2 bg-emerald-400" />
    <div className="text-xl">👨‍🎓</div>
    <div className="font-black text-emerald-800 tracking-wide">Students ({data.count})</div>
  </div>
);
