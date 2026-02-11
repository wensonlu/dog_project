const { supabase } = require('../config/supabase');

/**
 * Get platform statistics
 */
async function getStats(req, res) {
    try {
        // 获取待领养宠物数量
        const { count: availableDogs, error: dogsError } = await supabase
            .from('dogs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'available');

        // 获取已成功领养数量
        const { count: adoptedDogs, error: adoptedError } = await supabase
            .from('dogs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'adopted');

        // 获取用户总数
        const { count: totalUsers, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 获取总申请数
        const { count: totalApplications, error: appsError } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true });

        if (dogsError || adoptedError || usersError || appsError) {
            console.error('Stats error:', { dogsError, adoptedError, usersError, appsError });
            // 返回模拟数据作为 fallback
            return res.json({
                availableDogs: 128,
                adoptedDogs: 56,
                totalUsers: 2340,
                totalApplications: 89,
                isMock: true
            });
        }

        res.json({
            availableDogs: availableDogs || 0,
            adoptedDogs: adoptedDogs || 0,
            totalUsers: totalUsers || 0,
            totalApplications: totalApplications || 0,
            isMock: false
        });
    } catch (error) {
        console.error('Get stats error:', error);
        // 返回模拟数据
        res.json({
            availableDogs: 128,
            adoptedDogs: 56,
            totalUsers: 2340,
            totalApplications: 89,
            isMock: true
        });
    }
}

module.exports = {
    getStats
};
