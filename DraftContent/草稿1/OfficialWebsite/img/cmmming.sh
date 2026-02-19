#!/bin/bash

# 检查是否有图片文件
if ! compgen -G "*.jpg" "*.jpeg" "*.png" "*.gif" "*.bmp" > /dev/null; then
    echo "错误：未找到图片文件。"
    exit 1
fi

# 默认配置
base_name="image"
start_num=1
digit_count=2  # 默认为2位数字（01,02...）

# 创建备份目录
backup_dir="${base_name}_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# 询问是否保存到新文件夹
read -p "是否保存到新文件夹？(y/n) [n]: " save_to_new_dir
save_to_new_dir=${save_to_new_dir:-n}

# 如果选择保存到新文件夹，创建目标目录
target_dir=""
if [[ "$save_to_new_dir" == [Yy] ]]; then
    read -p "请输入目标文件夹名称: " target_dir
    mkdir -p "$target_dir"
fi

# 获取所有图片文件
image_files=()
for ext in jpg jpeg png gif bmp; do
    for file in *.${ext}; do
        [[ -f "$file" ]] && image_files+=("$file")
    done
done

# 重命名图片
count=$start_num
for file in "${image_files[@]}"; do
    # 复制原始文件到备份目录
    cp "$file" "$backup_dir/"
    
    # 获取文件扩展名
    ext="${file##*.}"
    ext="${ext,,}"  # 转换为小写
    
    # 生成新文件名
    new_name="${base_name}$(printf "%0${digit_count}d" "$count").${ext}"
    
    # 根据选择移动或重命名文件
    if [[ "$save_to_new_dir" == [Yy] ]]; then
        mv "$file" "$target_dir/$new_name"
        echo "已移动并重命名: $file -> $target_dir/$new_name"
    else
        mv "$file" "$new_name"
        echo "已重命名: $file -> $new_name"
    fi
    
    ((count++))
done

echo "批量重命名完成！"
echo "原始文件已备份到: $backup_dir"
if [[ "$save_to_new_dir" == [Yy] ]]; then
    echo "新文件保存在: $target_dir"
fi

# 询问是否删除备份
read -p "是否删除备份文件？(y/n) [n]: " delete_backup
delete_backup=${delete_backup:-n}
if [[ "$delete_backup" == [Yy] ]]; then
    rm -rf "$backup_dir"
    echo "已删除备份目录: $backup_dir"
else
    echo "备份文件保留在: $backup_dir"
fi